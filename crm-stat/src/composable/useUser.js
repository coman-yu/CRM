import { ref } from "vue";

// 公用用户信息
export function useUser() {
  // 从sessionStorage读取（每个标签页独立，互不影响）
  const userInfo = ref(
    JSON.parse(sessionStorage.getItem("crm_current_user")) || "",
  );

  // 保存登入信息，登入成功時調用
  function setUserInfo(user) {
    userInfo.value = user;
    console.log(userInfo);
    sessionStorage.setItem("crm_current_user", JSON.stringify(userInfo.value));
  }

  // 清除登入（登出用）
  function clearUserInfo() {
    userInfo.value = "";
    sessionStorage.removeItem("crm_current_user");
  }

  return {
    userInfo: userInfo.value,
    setUserInfo,
    clearUserInfo,
  };
}
