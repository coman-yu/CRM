<template>
  <div class="manage-user">
    <div class="header-bar">
      <h3>用户管理</h3>
      <div class="header-right">
        <el-button type="success" size="small" @click="openAdd">新增用户</el-button>
        <el-button type="primary" size="small" @click="loadUsers">刷新</el-button>
      </div>
    </div>
    <el-table :data="userList" border stripe max-height="600">
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="用户名" prop="username" min-width="120" />
      <el-table-column label="角色" width="120">
        <template #default="scope">
          <el-tag :type="getRoleTag(scope.row.role)">
            {{ getRoleText(scope.row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button type="warning" size="small" @click="openPwd(scope.row)"
            >修改密码</el-button
          >
          <el-button type="danger" size="small" @click="handleDelete(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="pwdDialog" title="修改密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户">
          {{ pwdTarget?.username }}
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="newPwd"
            type="password"
            show-password
            placeholder="输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPwd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="addDialog" title="新增用户" width="400px">
      <el-form label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="newAccount" placeholder="输入登录账号" />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input v-model="newPwdAdd" type="password" show-password placeholder="设置初始密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="newPwdConfirm" type="password" show-password placeholder="再次输入密码" />
        </el-form-item>
        <el-form-item label="岗位角色">
          <el-select v-model="newRole" placeholder="请选择岗位" style="width: 100%">
            <el-option label="销售" value="sales" />
            <el-option label="运营" value="operator" />
            <el-option label="中间人" value="middleman" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确定新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getMemberListApi,
  delUserAllApi,
  changePasswordApi,
  registerApi,
} from "@/api/auth";
import { useUser } from "@/composable/useUser";

const { userInfo: currentUser } = useUser();

const userList = ref([]);
const pwdDialog = ref(false);
const pwdTarget = ref(null);
const newPwd = ref("");

// 新增用户
const addDialog = ref(false);
const newAccount = ref("");
const newPwdAdd = ref("");
const newPwdConfirm = ref("");
const newRole = ref("");

const getRoleText = (r) => {
  switch (r) {
    case "admin":
      return "管理员";
    case "sales":
      return "销售";
    case "operator":
      return "运营";
    case "middleman":
      return "中间人";
    default:
      return r;
  }
};
const getRoleTag = (r) => {
  switch (r) {
    case "admin":
      return "danger";
    case "sales":
      return "primary";
    case "operator":
      return "success";
    case "middleman":
      return "warning";
    default:
      return "info";
  }
};

// 加载用户列表
const loadUsers = async () => {
  try {
    const res = await getMemberListApi();
    if (res.code === 200) {
      userList.value = res.data;
    } else {
      ElMessage.error(res.msg || "加载用户失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("请求后端失败");
  }
};

// 打开修改密码弹窗
const openPwd = (row) => {
  pwdTarget.value = row;
  newPwd.value = "";
  pwdDialog.value = true;
};

// 提交新密码
const submitPwd = async () => {
  if (!newPwd.value.trim()) {
    ElMessage.warning("请输入新密码");
    return;
  }
  try {
    const res = await changePasswordApi({
      id: pwdTarget.value.id,
      newPassword: newPwd.value.trim(),
      role: currentUser.role,
    });
    if (res.code === 200) {
      ElMessage.success(res.msg);
      pwdDialog.value = false;
    } else {
      ElMessage.error(res.msg || "修改失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("请求后端失败");
  }
};

// 打开新增用户弹窗
const openAdd = () => {
  addDialog.value = true;
  newAccount.value = "";
  newPwdAdd.value = "";
  newPwdConfirm.value = "";
  newRole.value = "";
};

// 提交新增用户
const submitAdd = async () => {
  const name = newAccount.value.trim();
  const pwd = newPwdAdd.value;
  const pwdConfirm = newPwdConfirm.value;
  const role = newRole.value;
  if (!name) {
    ElMessage.warning("请输入账号");
    return;
  }
  if (!pwd) {
    ElMessage.warning("请设置初始密码");
    return;
  }
  if (pwd !== pwdConfirm) {
    ElMessage.error("两次输入的密码不一致");
    return;
  }
  if (!role) {
    ElMessage.error("请选择岗位角色");
    return;
  }
  try {
    const res = await registerApi(name, pwd, role);
    if (res.code === 200) {
      ElMessage.success("新增成功，该账号可登录使用");
      addDialog.value = false;
      loadUsers();
    } else {
      ElMessage.error(res.msg || "新增失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("请求后端失败");
  }
};

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    "确定删除用户「" + row.username + "」及全部统计数据吗？",
    "提示",
    { type: "warning" },
  )
    .then(async () => {
      try {
        const res = await delUserAllApi({ id: row.id });
        if (res.code === 200) {
          ElMessage.success(res.msg);
          loadUsers();
        } else {
          ElMessage.error(res.msg);
        }
      } catch (e) {
        console.error(e);
        ElMessage.error("请求后端失败");
      }
    })
    .catch(() => {});
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.manage-user {
  padding: 16px;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h3 {
    margin: 0;
  }
  .header-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}
</style>
