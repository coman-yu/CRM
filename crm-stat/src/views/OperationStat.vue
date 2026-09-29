<template>
  <!-- 已登录：主系统布局壳 -->
  <el-container style="height: 100vh">
    <!-- 左侧菜单 -->
    <el-aside width="200px" style="background-color: #0e2840">
      <div class="logo">CRM</div>
      <el-menu
        :default-active="route.path"
        background-color="#0e2840"
        text-color="#fff"
        active-text-color="#409eff"
        router
      >
        <el-sub-menu index="customer">
          <template #title>客户管理</template>
          <el-menu-item
            index="/dashboard/customerAdd"
            v-if="isAdmin || currentUser.role === 'middleman'"
            >添加客户</el-menu-item
          >
          <el-menu-item index="/dashboard/customerList">客户列表</el-menu-item>
          <el-menu-item
            index="/dashboard/customerAssign"
            v-if="isAdmin || currentUser.role === 'middleman'"
            >客户分配</el-menu-item
          >
        </el-sub-menu>
        <el-menu-item index="/dashboard/manageUser" v-if="isAdmin">
          用户管理
        </el-menu-item>
        <el-sub-menu index="data" v-if="currentUser.role !== 'sales'">
          <template #title>数据统计</template>
          <el-menu-item index="/dashboard/stat">运营统计</el-menu-item>
          <div
            v-if="
              currentUser.role === 'admin' ||
              currentUser.role === 'operator' ||
              currentUser.role === 'middleman'
            "
          >
            <el-menu-item
              v-for="m in menuMembers"
              :key="m.username"
              :index="`/dashboard/member/${m.username}`"
            >
              <span>{{ m.username }}</span>
            </el-menu-item>
          </div>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 右側主容器 -->
    <el-container direction="vertical">
      <!-- 頂部header，全局都可見 -->
      <div class="top-header">
        <div></div>
        <div class="user-info">
          <span style="margin-left: 20px">
            当前用户：{{ currentUser.username }} ({{
              getCurrentRole(currentUser.role)
            }})
          </span>
          <el-button @click="logout" size="small" style="margin-left: 10px"
            >退出登录</el-button
          >
        </div>
      </div>

      <!-- 子页面全部渲染到这里 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { getMemberListApi } from "@/api/auth";
import { useUser } from "@/composable/useUser";

const { clearUserInfo, userInfo: currentUser } = useUser();
const router = useRouter();
const route = useRoute();

// 是否是超级管理员
const isAdmin = computed(() => currentUser.role === "admin");
// 侧边栏用户列表：只显示运营(operator)角色
const menuMembers = computed(() => {
  const list = isAdmin.value ? members.value : [currentUser];
  return list.filter((m) => m.role === "operator");
});

// 组员列表（用于侧边菜单渲染）
const members = ref([]);

// 退出登录
const logout = () => {
  clearUserInfo();
  router.push("/login");
  ElMessage.success("已退出登录");
};

// 获取组员列表
const getMemberList = async () => {
  try {
    const res = await getMemberListApi();
    if (res.code === 200) {
      members.value = res.data;
    }
  } catch (e) {
    ElMessage.error("获取组员列表失败");
    console.error(e);
  }
};

const getCurrentRole = () => {
  if (currentUser.role === "admin") {
    return "管理员";
  }
  if (currentUser.role === "sales") {
    return "销售";
  }
  if (currentUser.role === "operator") {
    return "运营";
  }
  if (currentUser.role === "middleman") {
    return "中间人";
  }
  return "";
};

onMounted(() => {
  getMemberList();
});
</script>

<style scoped lang="scss">
.logo {
  color: #fff;
  font-size: 20px;
  padding: 20px;
  font-weight: bold;
}
.top-header {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  .user-info {
    display: flex;
    align-items: center;
  }
}
</style>
