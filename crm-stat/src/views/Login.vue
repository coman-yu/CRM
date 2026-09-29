<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 style="text-align: center; margin-bottom: 20px">CRM运营统计系统</h2>
      <el-tabs v-model="loginTab">
        <el-tab-pane label="登录" name="login">
          <el-form>
            <el-form-item label="账号">
              <el-input v-model="loginForm.username" placeholder="请输入账号" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin" style="width: 100%"
                >登录</el-button
              >
            </el-form-item>
          </el-form>
          <div style="text-align: center; color: #666">
            还没有账号？<span
              style="color: #409eff; cursor: pointer"
              @click="loginTab = 'register'"
              >点这里注册</span
            >
          </div>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form>
            <el-form-item label="账号">
              <el-input
                v-model="registerForm.username"
                placeholder="请输入组员姓名"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请设置密码"
              />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
              />
            </el-form-item>
            <el-form-item label="岗位角色">
              <el-select
                v-model="registerForm.role"
                placeholder="请选择岗位"
                style="width: 100%"
              >
                <el-option label="销售" value="sales"></el-option>
                <el-option label="运营" value="operator"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleRegister"
                style="width: 100%"
                >注册</el-button
              >
            </el-form-item>
          </el-form>
          <div style="text-align: center; color: #666">
            已有账号？<span
              style="color: #409eff; cursor: pointer"
              @click="loginTab = 'login'"
              >点这里登录</span
            >
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { loginApi, registerApi } from "@/api/auth";
import { ElMessage } from "element-plus";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUser } from "@/composable/useUser";
const { setUserInfo } = useUser();

// ===================== 登录权限相关 =====================
const loginTab = ref("login");
const loginForm = ref({ username: "", password: "" });
const registerForm = ref({
  username: "",
  password: "",
  confirmPassword: "",
  role: "",
});
const router = useRouter();

// 登录
const handleLogin = async () => {
  const { username, password } = loginForm.value;
  if (!username || !password) {
    ElMessage.warning("请输入账号和密码");
    return;
  }
  try {
    const data = await loginApi(username, password);
    if (data?.code === 200) {
      console.log(data.data);
      setUserInfo(data.data);
      router.push("/dashboard");
      ElMessage.success("登录成功");
    } else {
      ElMessage.error(data.msg || "登录失败");
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("后端连接失败，请确认服务已启动");
  }
};
// 注册
const handleRegister = async () => {
  const { username, password, confirmPassword, role } = registerForm.value;
  if (!username || !password) {
    ElMessage.warning("账号密码不能为空");
    return;
  }
  if (password !== confirmPassword) {
    ElMessage.error("两次输入密码不一致");
    return;
  }
  if (!role) {
    ElMessage.error("请选择您的岗位");
    return;
  }
  try {
    const data = await registerApi(username, password, role);
    if (data.code === 200) {
      // 注册成功自动登录
      const loginInfo = await loginApi(username, password);
      setUserInfo(loginInfo.data);
      ElMessage.success("注册成功，已自动登录");
      router.push("/dashboard");
      registerForm.value = { username: "", password: "", confirmPassword: "" };
    } else {
      ElMessage.error(data.msg || "注册失败");
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("请求后端失败");
  }
};
</script>

<style scope="scss">
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  .login-card {
    width: 400px;
  }
}
</style>
