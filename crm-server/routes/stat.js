const express = require("express");
const pool = require("../db/mysql");
const router = express.Router();

// ===== 保存/更新某天數據（同一人同一天自動覆蓋）=====
// POST /api/stat/save
router.post("/stat/save", async (req, res) => {
  try {
    const {
      username,
      date,
      form = 0,
      shop = 0,
      valid = 0,
      sign = 0,
    } = req.body;
    if (!username || !date) {
      return res.json({ code: 400, msg: "組員和日期不能為空" });
    }
    // valid 由系统根据客户有效状态自动统计，忽略前端传入值
    await pool.query(
      `INSERT INTO op_stats(username, stat_date, form, shop, valid, sign)
       VALUES (?, ?, ?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE
         form = VALUES(form), shop = VALUES(shop), sign = VALUES(sign)`,
      [username, date, Number(form), Number(shop), Number(sign)],
    );
    res.json({ code: 200, msg: "保存成功" });
  } catch (e) {
    console.error(e);
    res.json({ code: 500, msg: "服務器錯誤" });
  }
});

// ===== 查詢某人在一段日期範圍的數據 =====
// GET /api/stat/list?username=丘國體&start=2026-09-01&end=2026-09-17
router.get("/stat/list", async (req, res) => {
  try {
    const { username, start, end } = req.query;
    if (!username) {
      return res.json({ code: 400, msg: "缺少username" });
    }
    // 有日期範圍就過濾，沒有就返回全部
    let sql =
      "SELECT stat_date AS date, form, shop, valid, sign FROM op_stats WHERE username = ?";
    const params = [username];
    if (start && end) {
      sql += " AND stat_date BETWEEN ? AND ?";
      params.push(start, end);
    }
    sql += " ORDER BY stat_date DESC";
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    console.error(e);
    res.json({ code: 500, msg: "服務器錯誤" });
  }
});

// ===== 查詢所有人的總和（排行榜用）=====
// GET /api/stat/summary?start=&end=
router.get("/stat/summary", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.json({ code: 400, msg: "缺少日期範圍" });
    }
    const [rows] = await pool.query(
      `SELECT username AS name,
              SUM(form) AS form, SUM(shop) AS shop,
              SUM(valid) AS valid, SUM(sign) AS sign
       FROM op_stats
       WHERE stat_date BETWEEN ? AND ?
       GROUP BY username`,
      [start, end],
    );
    res.json({ code: 200, data: rows });
  } catch (e) {
    console.error(e);
    res.json({ code: 500, msg: "服務器錯誤" });
  }
});

router.get("/stat/todayTeam", async (req, res) => {
  try {
    // mysql CURDATE() 获取数据库服务器的今日日期
    const [rows] = await pool.query(`
      SELECT username AS name, form, shop
      FROM op_stats
      WHERE stat_date = CURDATE()
    `);
    res.json({
      code: 200,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

module.exports = router;
