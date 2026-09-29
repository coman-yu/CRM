const express = require("express");
const pool = require("../db/mysql");

const router = express.Router();

// 注册
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const allowRoles = ["sales", "operator", "middleman"];
    const userRole = allowRoles.includes(role) ? role : "sales"; // 默认销售
    if (!username || !password) {
      return res.json({ code: 400, msg: "账号和密码不能为空" });
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length > 0) {
      return res.json({ code: 400, msg: "账号已经存在" });
    }
    await pool.query(
      "INSERT INTO users(username, password, role) VALUES (?, ?, ?)",
      [username, password, userRole],
    );
    res.json({ code: 200, msg: "注册成功" });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

// 登录
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, msg: "账号密码不能为空" });
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0) {
      return res.json({ code: 400, msg: "账号不存在" });
    }
    const user = rows[0];
    if (password.trim() !== user.password.trim()) {
      return res.json({ code: 400, msg: "账号或密码错误" });
    }
    res.json({
      code: 200,
      msg: "登录成功",
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

router.get("/auth/memberList", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, username, role
      FROM users
      WHERE role != 'admin'
      ORDER BY username
    `);
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

// 删除用户，同时删除该用户全部统计数据
// POST /api/auth/delUserAll
router.post("/auth/delUserAll", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ code: 400, msg: "缺少用户id" });
    }

    await conn.beginTransaction(); // 开启事务

    // 先查询该用户，禁止删除超级管理员
    const [userRow] = await conn.query(
      "SELECT username,role FROM users WHERE id = ?",
      [id],
    );
    if (userRow.length === 0) {
      await conn.rollback();
      return res.json({ code: 400, msg: "用户不存在" });
    }
    if (userRow[0].role === "admin") {
      await conn.rollback();
      return res.json({ code: 400, msg: "禁止删除超级管理员账号" });
    }
    const username = userRow[0].username;

    // 删除用户
    await conn.query("DELETE FROM users WHERE id = ?", [id]);
    // 删除该用户全部统计记录 op_stats
    await conn.query("DELETE FROM op_stats WHERE username = ?", [username]);

    await conn.commit(); // 提交事务

    res.json({
      code: 200,
      msg: "删除成功，已清除该用户账号以及全部统计数据",
    });
  } catch (err) {
    await conn.rollback(); // 出错回滚
    console.error("删除用户事务异常：", err);
    res.json({ code: 500, msg: "服务器异常，删除失败" });
  } finally {
    conn.release(); // 释放连接
  }
});

// 修改用户密码（管理员操作）
// POST /api/auth/changePassword
router.post("/auth/changePassword", async (req, res) => {
  try {
    const { id, newPassword, role } = req.body;
    if (role !== "admin") {
      return res.json({ code: 403, msg: "无权限操作：仅管理员可修改用户密码" });
    }
    if (!id || !newPassword || !newPassword.trim()) {
      return res.json({ code: 400, msg: "缺少用户id或新密码" });
    }
    const [userRow] = await pool.query("SELECT role FROM users WHERE id = ?", [id]);
    if (userRow.length === 0) {
      return res.json({ code: 400, msg: "用户不存在" });
    }
    if (userRow[0].role === "admin") {
      return res.json({ code: 400, msg: "禁止修改管理员账号密码" });
    }
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [newPassword.trim(), id]);
    res.json({ code: 200, msg: "密码修改成功" });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: "服务器错误" });
  }
});

module.exports = router;
