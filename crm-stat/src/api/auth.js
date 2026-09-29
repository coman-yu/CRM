import service from "@/utils/request";

export async function loginApi(username, password) {
  const resp = await service.post("/api/login", { username, password });
  return resp;
}
export async function registerApi(username, password, role) {
  const resp = await service.post("/api/register", {
    username,
    password,
    role,
  });
  return resp;
}
export const getMemberListApi = () => {
  return service.get("/api/auth/memberList");
};
// 删除用户，连带删除该用户所有统计数据
export const delUserAllApi = (payload) => {
  return service.post("/api/auth/delUserAll", payload);
};
// 修改用户密码（管理员）
export const changePasswordApi = (payload) => {
  return service.post("/api/auth/changePassword", payload);
};
