const express = require("express");
const pool = require("../db/mysql");

const router = express.Router();

// 重算某运营某天的有效资源数（客户 valid_status=1 且归属该运营），写入 op_stats.valid
async function syncValidStat(operator, statDate) {
  if (!operator || !statDate) return;
  const [cnt] = await pool.query(
    `SELECT COUNT(*) AS c FROM customer
     WHERE operator_user = ? AND DATE(create_time) = ? AND valid_status = 1 AND is_deleted = 0`,
    [operator, statDate],
  );
  await pool.query(
    `INSERT INTO op_stats(username, stat_date, form, shop, valid, sign)
     VALUES (?, ?, 0, 0, ?, 0)
     ON DUPLICATE KEY UPDATE valid = VALUES(valid)`,
    [operator, statDate, cnt[0].c],
  );
}

// 重算某运营某天的签约数（客户首次签约时间为该日且归属该运营），写入 op_stats.sign
async function syncSignStat(operator, statDate) {
  if (!operator || !statDate) return;
  const [cnt] = await pool.query(
    `SELECT COUNT(*) AS c FROM customer
     WHERE operator_user = ? AND DATE(first_sign_time) = ? AND is_deleted = 0`,
    [operator, statDate],
  );
  await pool.query(
    `INSERT INTO op_stats(username, stat_date, form, shop, valid, sign)
     VALUES (?, ?, 0, 0, 0, ?)
     ON DUPLICATE KEY UPDATE sign = VALUES(sign)`,
    [operator, statDate, cnt[0].c],
  );
}

// 日期统一格式化 YYYY-MM-DD
function fmtDate(d) {
  const dt = d instanceof Date ? d : new Date(String(d).replace(" ", "T"));
  return (
    dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0")
  );
}

// 重算某运营某天的到店数（客户到店时间为该日且归属该运营），写入 op_stats.shop
async function syncShopStat(operator, statDate) {
  if (!operator || !statDate) return;
  const [cnt] = await pool.query(
    `SELECT COUNT(*) AS c FROM customer
     WHERE operator_user = ? AND DATE(arrive_time) = ? AND is_deleted = 0`,
    [operator, statDate],
  );
  await pool.query(
    `INSERT INTO op_stats(username, stat_date, form, shop, valid, sign)
     VALUES (?, ?, 0, ?, 0, 0)
     ON DUPLICATE KEY UPDATE shop = VALUES(shop)`,
    [operator, statDate, cnt[0].c],
  );
}

router.post("/customer/add", async (req, res) => {
  try {
    const {
      name,
      phone,
      wechat,
      qq,
      address,
      source,
      remark,
      createUser,
      cust_status,
      validStatus,
      role,
    } = req.body;
    // 权限校验：仅管理员/中间人可新增客户
    if (role !== "admin" && role !== "middleman") {
      return res.json({
        code: 403,
        msg: "无权限操作：仅运营/管理员可新增客户",
      });
    }

    let status = [0, 1, 2].includes(Number(cust_status))
      ? Number(cust_status)
      : 0;

    const sql = `
INSERT INTO customer (name,phone,wechat,qq,address,source,remark,cust_status,valid_status,create_user)
VALUES (?,?,?,?,?,?,?,?,?,?)
`;
    const [result] = await pool.query(sql, [
      name,
      phone ?? "",
      wechat ?? "",
      qq ?? "",
      address ?? "",
      source ?? "",
      remark ?? "",
      status,
      validStatus ?? 0,
      createUser,
    ]);

    res.json({
      code: 200,
      msg: "新增客户成功",
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器异常" });
  }
});

// 获取客户列表（根据角色权限过滤）
router.get("/customer/list", async (req, res) => {
  try {
    const { username, role } = req.query;
    if (!username || !role) {
      return res.json({ code: 400, msg: "缺少用户信息" });
    }

    let baseSql = `
      SELECT id,name,phone,wechat,qq,address,source,remark,cust_status,valid_status,sale_user,operator_user,create_time
      FROM customer
    `;
    let whereArr = ["is_deleted = 0"];
    let params = [];

    if (role === "admin" || role === "middleman") {
      //管理员：查全部，不加where条件
    } else if (role === "sales") {
      //销售：只看自己录入
      whereArr.push(` sale_user = ? `);
      params.push(username);
    } else if (role === "operator") {
      //运营：只看分配给自己
      whereArr.push(` operator_user = ? `);
      params.push(username);
    }

    if (whereArr.length > 0) {
      baseSql += " WHERE " + whereArr.join(" AND ");
    }
    baseSql += " ORDER BY create_time DESC, id DESC ";

    const [rows] = await pool.query(baseSql, params);
    res.json({
      code: 200,
      msg: "ok",
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "查询失败" });
  }
});

// 更新客戶（只更新提交的字段，局部更新不清空其他数据）
router.put("/customer/update", async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id) {
      return res.json({ code: 400, msg: "缺少客户id" });
    }
    if (!name || name.trim() === "") {
      return res.json({ code: 400, msg: "客户名称不能为空" });
    }

    // 记录更新前的运营归属 / 添加情况 / 已加上时间（用于有效资源与表单统计）
    const [oldRow] = await pool.query(
      "SELECT operator_user, cust_status, added_time, first_sign_time, arrive_time FROM customer WHERE id = ?",
      [id],
    );
    const oldOp = oldRow.length > 0 ? oldRow[0].operator_user : null;
    const oldStatus = oldRow.length > 0 ? oldRow[0].cust_status : null;
    const oldAddedTime = oldRow.length > 0 ? oldRow[0].added_time : null;
    const oldFirstSign = oldRow.length > 0 ? oldRow[0].first_sign_time : null;
    const oldArrive = oldRow.length > 0 ? oldRow[0].arrive_time : null;

    // 前端字段 -> 数据库列 白名单
    const fieldMap = {
      name: "name",
      age: "age",
      phone: "phone",
      wechat: "wechat",
      qq: "qq",
      address: "address",
      source: "source",
      registerAddr: "register_addr",
      sourceAccount: "source_account",
      packageName: "package_name",
      eggType: "egg_type",
      promoteType: "promote_type",
      introducer: "introducer",
      opUser: "operator_user",
      arriveTime: "arrive_time",
      visitTime: "visit_time",
      nextVisit: "next_visit",
      firstSignTime: "first_sign_time",
      latestSignTime: "latest_sign_time",
      moreContact: "more_contact",
      semPage: "sem_page",
      remark: "remark",
      sales: "sales",
      manager: "manager",
      opName: "op_name",
      medService: "med_service",
      girlService: "girl_service",
      followStage: "follow_stage",
      serviceStage: "service_stage",
      cust_status: "cust_status",
      validStatus: "valid_status",
      valid_status: "valid_status", // 兼容列表页下划线传参
      importantCustomer: "important_customer",
      promoteInvalid: "promote_invalid",
      cLevel: "c_level",
      validArrive: "valid_arrive",
    };

    const sets = [];
    const params = [];
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in req.body) {
        sets.push(col + "=?");
        params.push(req.body[key] ?? null);
      }
    }
    if (sets.length === 0) {
      return res.json({ code: 400, msg: "没有可更新的字段" });
    }

    const sql = "UPDATE customer SET " + sets.join(",") + " WHERE id=?";
    params.push(id);
    const [result] = await pool.query(sql, params);

    // 查询更新后的运营归属与创建日期（有效资源 / 表单统计共用）
    const [cur] = await pool.query(
      "SELECT operator_user, DATE_FORMAT(create_time, '%Y-%m-%d') AS d, DATE_FORMAT(first_sign_time, '%Y-%m-%d') AS sd, DATE_FORMAT(arrive_time, '%Y-%m-%d') AS ad FROM customer WHERE id = ?",
      [id],
    );

    // ===== 表单数自动同步：添加情况变为已加上(1) -> form+1；离开已加上 -> form-1 =====
    const newStatusRaw = req.body.cust_status;
    if (newStatusRaw !== undefined) {
      const newStatus = Number(newStatusRaw);
      const oldStatusNum = oldStatus === null || oldStatus === undefined ? null : Number(oldStatus);
      const opNow = cur.length > 0 ? cur[0].operator_user : null;
      const pad = (n) => String(n).padStart(2, "0");
      const nowDt = new Date();
      const dStr =
        nowDt.getFullYear() + "-" + pad(nowDt.getMonth() + 1) + "-" + pad(nowDt.getDate());
      if (newStatus === 1 && oldStatusNum !== 1) {
        // 变为已加上：记录时间，并给该运营当天表单 +1
        const tStr =
          dStr + " " + pad(nowDt.getHours()) + ":" + pad(nowDt.getMinutes()) + ":" + pad(nowDt.getSeconds());
        await pool.query("UPDATE customer SET added_time = ? WHERE id = ?", [tStr, id]);
        if (opNow) {
          await pool.query(
            `INSERT INTO op_stats(username, stat_date, form, shop, valid, sign)
             VALUES (?, ?, 1, 0, 0, 0)
             ON DUPLICATE KEY UPDATE form = form + 1`,
            [opNow, dStr],
          );
        }
      } else if (newStatus !== 1 && oldStatusNum === 1) {
        // 离开已加上：清除记录时间，按原已加上日期给表单 -1
        await pool.query("UPDATE customer SET added_time = NULL WHERE id = ?", [id]);
        if (oldAddedTime && opNow) {
          const ad = oldAddedTime instanceof Date ? oldAddedTime : new Date(String(oldAddedTime).replace(" ", "T"));
          const adStr = ad.getFullYear() + "-" + pad(ad.getMonth() + 1) + "-" + pad(ad.getDate());
          await pool.query(
            "UPDATE op_stats SET form = GREATEST(form - 1, 0) WHERE username = ? AND stat_date = ?",
            [opNow, adStr],
          );
        }
      }
    }

    // 客户换运营且此前已加上：旧运营表单 -1，新运营表单 +1（按已加上日期）
    const newOp = cur.length > 0 ? cur[0].operator_user : null;
    if (oldAddedTime && oldOp && newOp && oldOp !== newOp) {
      const ad = oldAddedTime instanceof Date ? oldAddedTime : new Date(String(oldAddedTime).replace(" ", "T"));
      const pad2 = (n) => String(n).padStart(2, "0");
      const adStr = ad.getFullYear() + "-" + pad2(ad.getMonth() + 1) + "-" + pad2(ad.getDate());
      await pool.query(
        "UPDATE op_stats SET form = GREATEST(form - 1, 0) WHERE username = ? AND stat_date = ?",
        [oldOp, adStr],
      );
      await pool.query(
        `INSERT INTO op_stats(username, stat_date, form, shop, valid, sign)
         VALUES (?, ?, 1, 0, 0, 0)
         ON DUPLICATE KEY UPDATE form = form + 1`,
        [newOp, adStr],
      );
    }

    // 同步有效资源统计：客户有效状态/运营归属变化后，重算该运营该日期的 valid
    if (cur.length > 0 && cur[0].d) {
      await syncValidStat(cur[0].operator_user, cur[0].d);
      if (oldOp && oldOp !== cur[0].operator_user) {
        await syncValidStat(oldOp, cur[0].d);
      }
    }

    // 同步签约统计：首次签约时间变化/运营归属变化后，重算相关运营的 sign
    if (cur.length > 0) {
      const newSignD = cur[0].sd;
      const oldSignD = oldFirstSign ? fmtDate(oldFirstSign) : null;
      const newOpSign = cur[0].operator_user;
      if (newSignD) {
        await syncSignStat(newOpSign, newSignD);
        if (oldOp && oldOp !== newOpSign) await syncSignStat(oldOp, newSignD);
      }
      if (oldSignD && oldSignD !== newSignD) {
        await syncSignStat(newOpSign, oldSignD);
        if (oldOp && oldOp !== newOpSign) await syncSignStat(oldOp, oldSignD);
      }
    }

    // 同步到店统计：到店时间变化/运营归属变化后，重算相关运营的 shop
    if (cur.length > 0) {
      const newShopD = cur[0].ad;
      const oldShopD = oldArrive ? fmtDate(oldArrive) : null;
      const newOpShop = cur[0].operator_user;
      if (newShopD) {
        await syncShopStat(newOpShop, newShopD);
        if (oldOp && oldOp !== newOpShop) await syncShopStat(oldOp, newShopD);
      }
      if (oldShopD && oldShopD !== newShopD) {
        await syncShopStat(newOpShop, oldShopD);
        if (oldOp && oldOp !== newOpShop) await syncShopStat(oldOp, oldShopD);
      }
    }

    res.json({ code: 200, msg: "更新成功" });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "更新失敗" });
  }
});

// GET /api/customer/detail?id=126358
router.get("/customer/detail", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.json({ code: 400, msg: "缺少客户id" });
    }
    const [rows] = await pool.query(
      `
      SELECT 
        id,name,phone,wechat,qq,address,source,remark,cust_status,valid_status,
        age,register_addr,source_account,package_name,egg_type,
        promote_type,introducer,create_user,operator_user,create_time,
        arrive_time,visit_time,next_visit,last_follow_time,
        first_sign_time,latest_sign_time,more_contact,sem_page,
        sales,manager,op_name,med_service,girl_service,
        follow_stage,service_stage,
        important_customer,promote_invalid,c_level,valid_arrive
      FROM customer WHERE id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.json({ code: 404, msg: "客户不存在" });
    }
    const row = rows[0];
    // 数据库下划线转前端驼峰
    const data = {
      id: row.id,
      name: row.name,
      age: row.age,
      registerAddr: row.register_addr,
      phone: row.phone,
      wechat: row.wechat,
      qq: row.qq,
      address: row.address,
      source: row.source,
      sourceAccount: row.source_account,
      packageName: row.package_name,
      eggType: row.egg_type,
      promoteType: row.promote_type,
      introducer: row.introducer,
      createUser: row.create_user,
      opUser: row.operator_user,
      createTime: row.create_time,
      arriveTime: row.arrive_time,
      visitTime: row.visit_time,
      nextVisit: row.next_visit,
      lastFollowTime: row.last_follow_time,
      firstSignTime: row.first_sign_time,
      latestSignTime: row.latest_sign_time,
      moreContact: row.more_contact,
      semPage: row.sem_page,
      remark: row.remark,
      sales: row.sales,
      manager: row.manager,
      opName: row.op_name,
      medService: row.med_service,
      girlService: row.girl_service,
      followStage: row.follow_stage,
      serviceStage: row.service_stage,
      cust_status: row.cust_status,
      validStatus: row.valid_status,
      importantCustomer: row.important_customer,
      promoteInvalid: row.promote_invalid,
      cLevel: row.c_level,
      validArrive: row.valid_arrive,
    };
    res.json({ code: 200, data });
  } catch (err) {
    console.error("get customer detail error:", err);
    res.json({ code: 500, msg: "查询数据库失败" });
  }
});

// 获取销售账号列表（用于中间人分配客户）
// GET /api/customer/getSalesList
router.get("/customer/getSalesList", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username FROM users WHERE role = 'sales' ORDER BY username",
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

// 获取运营账号列表（用于分配客户给运营）
// GET /api/customer/getOperatorList
router.get("/customer/getOperatorList", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username FROM users WHERE role = 'operator' ORDER BY username",
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

// 删除（隐藏）客户记录（中间人/管理员）
// POST /api/customer/deleteCustomer
router.post("/customer/deleteCustomer", async (req, res) => {
  try {
    const { customerId, role } = req.body;
    // 权限校验：仅中间人/管理员可删除
    if (role !== "admin" && role !== "middleman") {
      return res.json({
        code: 403,
        msg: "无权限操作：仅中间人/管理员可删除客户",
      });
    }
    if (!customerId) {
      return res.json({ code: 400, msg: "缺少客户id" });
    }
    const [delRow] = await pool.query(
      "SELECT operator_user, DATE_FORMAT(create_time, '%Y-%m-%d') AS d FROM customer WHERE id = ?",
      [customerId],
    );
    await pool.query("UPDATE customer SET is_deleted = 1 WHERE id = ?", [
      customerId,
    ]);
    // 删除后重算该运营该日期的有效资源统计
    if (delRow.length > 0 && delRow[0].d) {
      await syncValidStat(delRow[0].operator_user, delRow[0].d);
    }
    res.json({ code: 200, msg: "已删除（隐藏）" });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

// 分配客户给销售（中间人/管理员）
// POST /api/customer/assignSales
router.post("/customer/assignSales", async (req, res) => {
  try {
    const { customerId, saleUser, operatorUser, role } = req.body;
    // 权限校验：仅中间人/管理员可分配客户
    if (role !== "admin" && role !== "middleman") {
      return res.json({
        code: 403,
        msg: "无权限操作：仅中间人/管理员可分配客户",
      });
    }
    if (!customerId) {
      return res.json({ code: 400, msg: "缺少客户id" });
    }
    // 记录原运营归属（用于有效资源统计重算）
    const [oldRow] = await pool.query(
      "SELECT operator_user, added_time, DATE_FORMAT(first_sign_time, '%Y-%m-%d') AS sd, DATE_FORMAT(arrive_time, '%Y-%m-%d') AS ad, DATE_FORMAT(create_time, '%Y-%m-%d') AS d FROM customer WHERE id = ?",
      [customerId],
    );
    const oldOp = oldRow.length > 0 ? oldRow[0].operator_user : null;
    const oldAddedTime = oldRow.length > 0 ? oldRow[0].added_time : null;
    const createDate = oldRow.length > 0 ? oldRow[0].d : null;
    const signDate = oldRow.length > 0 ? oldRow[0].sd : null;
    const shopDate = oldRow.length > 0 ? oldRow[0].ad : null;

    await pool.query(
      "UPDATE customer SET sale_user = ?, operator_user = ? WHERE id = ?",
      [saleUser || null, operatorUser || null, customerId],
    );

    // 客户换运营且此前已加上：旧运营表单 -1，新运营表单 +1（按已加上日期）
    if (oldAddedTime && oldOp && operatorUser && oldOp !== operatorUser) {
      const ad = oldAddedTime instanceof Date ? oldAddedTime : new Date(String(oldAddedTime).replace(" ", "T"));
      const pad2 = (n) => String(n).padStart(2, "0");
      const adStr = ad.getFullYear() + "-" + pad2(ad.getMonth() + 1) + "-" + pad2(ad.getDate());
      await pool.query(
        "UPDATE op_stats SET form = GREATEST(form - 1, 0) WHERE username = ? AND stat_date = ?",
        [oldOp, adStr],
      );
      await pool.query(
        `INSERT INTO op_stats(username, stat_date, form, shop, valid, sign)
         VALUES (?, ?, 1, 0, 0, 0)
         ON DUPLICATE KEY UPDATE form = form + 1`,
        [operatorUser, adStr],
      );
    }

    // 重算有效资源统计（新归属 + 原归属）
    if (createDate) {
      await syncValidStat(operatorUser || null, createDate);
      if (oldOp && oldOp !== operatorUser) {
        await syncValidStat(oldOp, createDate);
      }
    }

    // 重算签约统计（新归属 + 原归属，按首次签约日期）
    if (signDate) {
      await syncSignStat(operatorUser || null, signDate);
      if (oldOp && oldOp !== operatorUser) {
        await syncSignStat(oldOp, signDate);
      }
    }

    // 重算到店统计（新归属 + 原归属，按到店日期）
    if (shopDate) {
      await syncShopStat(operatorUser || null, shopDate);
      if (oldOp && oldOp !== operatorUser) {
        await syncShopStat(oldOp, shopDate);
      }
    }

    res.json({ code: 200, msg: "分配成功" });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

module.exports = router;
