import request from "@/utils/request";

export const addCustomerApi = (payload) => {
  return request.post("/api/customer/add", payload);
};

export const getCustomerListApi = (username, role) => {
  return request.get("/api/customer/list", {
    params: {
      username,
      role,
    },
  });
};

export const updateCustomerApi = (payload) => {
  return request.put("/api/customer/update", payload);
};

export async function getCustomerDetailApi(params) {
  // GET /api/customer/detail?id=xxx
  return request.get("/api/customer/detail", { params });
}

export const getSalesListApi = () => {
  return request.get("/api/customer/getSalesList");
};
export const getOperatorListApi = () => {
  return request.get("/api/customer/getOperatorList");
};

export const assignSalesApi = (payload) => {
  return request.post("/api/customer/assignSales", payload);
};
export const deleteCustomerApi = (payload) => {
  return request.post("/api/customer/deleteCustomer", payload);
};
