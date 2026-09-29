import { createRouter, createWebHistory } from "vue-router";
import OperationStat from "../views/OperationStat.vue";
import Login from "../views/Login.vue";
import StatIndex from "../views/StatIndex.vue";
import MemberInput from "../views/MemberInput.vue";
import CustomerAdd from "../views/CustomerAdd.vue";
import CustomerList from "../views/CustomerList.vue";
import CustomerDetail from "../views/CustomerDetail.vue";
import CustomerAssign from "../views/CustomerAssign.vue";
import ManageUser from "../views/ManageUser.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "登录注册",
    component: Login,
  },
  {
    path: "/dashboard",
    component: OperationStat,
    redirect: "/dashboard/stat",
    children: [
      {
        path: "stat",
        name: "运营统计",
        component: StatIndex,
      },
      {
        path: "member/:username",
        name: "组员录入",
        component: MemberInput,
      },
      {
        path: "customerAdd",
        name: "添加客户信息",
        component: CustomerAdd,
      },
      {
        path: "customerList",
        name: "客户列表",
        component: CustomerList,
      },
      {
        path: "customer/:id",
        name: "客户信息",
        component: CustomerDetail,
      },
      {
        path: "customerAssign",
        name: "客户分配",
        component: CustomerAssign,
      },
      {
        path: "manageUser",
        name: "用户管理",
        component: ManageUser,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 登录守卫：未登录访问后台跳登录页，已登录访问登录页跳回后台
router.beforeEach((to, from, next) => {
  const user = localStorage.getItem("crm_current_user");
  if (to.path.startsWith("/dashboard") && !user) {
    return next("/login");
  }
  if (to.path === "/login" && user) {
    return next("/dashboard/stat");
  }

  // 销售角色禁止访问运营统计相关路由（stat / member/*）
  if (user) {
    let currentUser = null;
    try {
      currentUser = JSON.parse(user);
    } catch (e) {
      currentUser = null;
    }
    if (
      currentUser &&
      currentUser.role === "sales" &&
      (to.path.startsWith("/dashboard/stat") ||
        to.path.startsWith("/dashboard/member/"))
    ) {
      return next("/dashboard/customerList");
    }
    // 用户管理仅管理员可访问
    if (
      currentUser &&
      to.path.startsWith("/dashboard/manageUser") &&
      currentUser.role !== "admin"
    ) {
      return next("/dashboard/customerList");
    }
  }

  next();
});

export default router;
