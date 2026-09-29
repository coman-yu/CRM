import request from "@/utils/request";

// 保存/更新某一天统计数据
export const statSaveApi = (payload) => {
  return request.post("/api/stat/save", payload);
};

// 获取某人一段日期的数据
export const statListApi = (username, start, end) => {
  return request.get("/api/stat/list", {
    params: {
      username,
      start,
      end,
    },
  });
};

// 获取所有人区间汇总（排行榜）
export const statSummaryApi = (start, end) => {
  return request.get("/api/stat/summary", {
    params: {
      start,
      end,
    },
  });
};

export const getTeamsTodayStat = () => {
  return request.get("/api/stat/todayTeam", {});
};
