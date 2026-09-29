import axios from "axios";

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // .env文件配置 VITE_API_BASE_URL=http://127.0.0.1:3000
  timeout: 10000,
});

// 请求拦截器
service.interceptors.request.use((config) => {
  return config;
});

// 响应拦截器
service.interceptors.response.use(
  (res) => {
    return res.data;
  },
  (err) => {
    console.error("请求错误", err);
    return Promise.reject(err);
  },
);

export default service;
