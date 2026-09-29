const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "123456", //记得替换成你自己的root密码
  database: "crm",
  connectionLimit: 10,
  waitForConnections: true,
});

// 测试连接，单独写自执行函数
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL连接成功");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL连接失败：", err.message);
  }
})();

module.exports = pool;
