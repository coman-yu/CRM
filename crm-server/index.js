const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const authRouter = require("./routes/auth");
const statRouter = require("./routes/stat");
const customerRouter = require("./routes/customer");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 挂载认证路由
app.use("/api", authRouter);
app.use("/api", statRouter);
app.use("/api", customerRouter);

// 托管前端构建产物（同源部署：/api 之外的请求回退到 index.html）
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`🚀 Server run at http://127.0.0.1:${port}`);
});
