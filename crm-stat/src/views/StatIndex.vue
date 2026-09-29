<template>
  <div class="stat-index">
    <div class="header-bar">
      <h3>运营统计</h3>
      <div class="header-right">
        <div class="date-group">
          <el-date-picker
            v-model="dateRange[0]"
            type="date"
            placeholder="开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledStartDate"
          ></el-date-picker>
          <span class="separator">至</span>
          <el-date-picker
            v-model="dateRange[1]"
            type="date"
            placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledEndDate"
          ></el-date-picker>
        </div>
        <el-button type="primary" @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stat-row">
      <div class="stat-block">
        <div class="block-title">我的</div>
        <div class="card-list">
          <el-card
            class="stat-card"
            v-for="item in myStats"
            :key="item.label"
          >
            <div class="label">{{ item.label }}</div>
            <div class="value">{{ item.value }}</div>
          </el-card>
        </div>
      </div>
      <div class="stat-block">
        <div class="block-title">团队</div>
        <div class="card-list">
          <el-card
            class="stat-card"
            v-for="item in teamStats"
            :key="item.label"
          >
            <div class="label">{{ item.label }}</div>
            <div class="value">{{ item.value }}</div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 5个排行榜表格 -->
    <el-row :gutter="16" class="table-row">
      <el-col :span="4.8">
        <el-card>
          <template #header>表单排行榜</template>
          <el-table
            :data="formRankData"
            border
            stripe
            size="small"
            height="300"
          >
            <el-table-column prop="rank" label="排名" width="60" />
            <el-table-column prop="name" label="姓名" width="80">
              <template #default="scope">
                <div class="name-cell">
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="表单数量">
              <template #default="scope">
                <el-input
                  v-model="scope.row.count"
                  :min="0"
                  style="width: 72px"
                  size="small"
                  controls-position="right"
                  disabled
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="4.8">
        <el-card>
          <template #header>到店排行榜</template>
          <el-table
            :data="shopRankData"
            border
            height="300"
            stripe
            size="small"
          >
            <el-table-column prop="rank" label="排名" width="60" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="count" label="到店人数">
              <template #default="scope">
                <el-input
                  v-model="scope.row.count"
                  :min="0"
                  style="width: 72px"
                  size="small"
                  disabled
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="4.8">
        <el-card>
          <template #header>有效排行榜</template>
          <el-table
            :data="validRankData"
            height="300"
            border
            stripe
            size="small"
          >
            <el-table-column prop="rank" label="排名" width="60" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="count" label="有效人数">
              <template #default="scope">
                <el-input
                  v-model="scope.row.count"
                  :min="0"
                  style="width: 72px"
                  size="small"
                  controls-position="right"
                  disabled
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="4.8">
        <el-card>
          <template #header>表单倒数排行榜</template>
          <el-table
            :data="formBottomRankData"
            height="300"
            border
            stripe
            size="small"
          >
            <el-table-column prop="rank" label="排名" width="60" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="count" label="表单数量">
              <template #default="scope">
                <el-input
                  v-model="scope.row.count"
                  :min="0"
                  style="width: 72px"
                  size="small"
                  controls-position="right"
                  disabled
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="4.8">
        <el-card>
          <template #header>签约排行榜</template>
          <el-table
            :data="signRankData"
            height="300"
            border
            stripe
            size="small"
          >
            <el-table-column prop="rank" label="排名" width="60" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="count" label="签约数量">
              <template #default="scope">
                <el-input
                  v-model="scope.row.count"
                  :min="0"
                  size="small"
                  controls-position="right"
                  disabled
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getTeamsTodayStat,
  statListApi,
  statSummaryApi,
} from "@/api/stat";
import dayjs from "dayjs";
import { useUser } from "@/composable/useUser";

const { userInfo: currentUser } = useUser();
const isAdmin = computed(() => currentUser.role === "admin");


// 日期范围（默认最近30天，包含今天）
const dateRange = ref([
  dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD"),
]);

// 开始日期禁用规则：所有比结束日期晚的日期都置灰，不能选（支持选同一天）
const disabledStartDate = (time) => {
  if (!dateRange.value[1]) return false;
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  const end = new Date(dateRange.value[1]);
  end.setHours(0, 0, 0, 0);
  return d.getTime() > end.getTime();
};
// 结束日期禁用规则：所有比开始日期早的日期都置灰，不能选（支持选同一天）
const disabledEndDate = (time) => {
  if (!dateRange.value[0]) return false;
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  const start = new Date(dateRange.value[0]);
  start.setHours(0, 0, 0, 0);
  return d.getTime() < start.getTime();
};

const buildRankSource = ref([]);
const myData = ref({});
const teamsData = ref([]);

// 加载日期范围内的统计
const loadData = async () => {
  const [start, end] = dateRange.value;
  try {
    const res = await statSummaryApi(start, end);
    if (res.code === 200) {
      buildRankSource.value = res.data;
      ElMessage.success("数据已刷新");
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("刷新失败，后端连接异常");
  }
};

const loadMyTodayData = async () => {
  const myName = currentUser.username;
  const today = dayjs().format("YYYY-MM-DD");
  const res = await statListApi(myName, today, today);
  myData.value = res.data?.[0];
};

const loadTeamsTodayData = async () => {
  const res = await getTeamsTodayStat();
  teamsData.value = res.data;
};

// 我的统计
const myStats = computed(() => {
  const myName = currentUser.username;
  if (!myName) return Array(6).fill({ label: "", value: 0 });
  const total = buildRankSource.value.find((m) => m.name === myName);
  return [
    { label: "今日表单", value: myData.value?.form || 0 },
    { label: "今日到店", value: myData.value?.shop || 0 },
    { label: "有效", value: total?.valid || 0 },
    { label: "表单", value: total?.form || 0 },
    { label: "到店", value: total?.shop || 0 },
    { label: "签约", value: total?.sign || 0 },
  ];
});

// 团队统计
const teamStats = computed(() => {
  let total = { form: 0, shop: 0, valid: 0, sign: 0 };
  let todayTotal = { form: 0, shop: 0 };
  buildRankSource.value.forEach((t) => {
    total.form += Number(t.form);
    total.shop += Number(t.shop);
    total.valid += Number(t.valid);
    total.sign += Number(t.sign);
  });
  teamsData.value.forEach((t) => {
    todayTotal.form += Number(t.form);
    todayTotal.shop += Number(t.shop);
  });
  return [
    { label: "今日表单", value: todayTotal.form },
    { label: "今日到店", value: todayTotal.shop },
    { label: "有效", value: total.valid },
    { label: "表单", value: total.form },
    { label: "到店", value: total.shop },
    { label: "签约", value: total.sign },
  ];
});

// 排序生成排行榜
const buildRank = (key, asc = false) => {
  const list = buildRankSource.value.map((m) => {
    return { name: m.name, count: Number(m[key]) };
  });
  list.sort((a, b) => (asc ? a.count - b.count : b.count - a.count));
  return list.map((item, idx) => ({
    ...item,
    rank: `NO.${idx + 1}`,
  }));
};

// 5个排行榜数据
const formRankData = computed(() => buildRank("form"));
const shopRankData = computed(() => buildRank("shop"));
const validRankData = computed(() => buildRank("valid"));
const formBottomRankData = computed(() => buildRank("form", true)); // 升序
const signRankData = computed(() => buildRank("sign"));

// 刷新数据
const refreshData = () => {
  loadData();
};

onMounted(() => {
  loadData();
  loadMyTodayData();
  loadTeamsTodayData();
});
</script>

<style scoped lang="scss">
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  .header-right {
    display: flex;
    gap: 10px;
    align-items: center;
    .date-group {
      display: flex;
      align-items: center;
      gap: 8px;
      .separator {
        color: #666;
      }
    }
  }
}
.stat-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}
.stat-block {
  flex: 1;
  .block-title {
    margin-bottom: 8px;
    font-weight: bold;
  }
  .card-list {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }
  .stat-card {
    text-align: center;
    :deep(.el-card__body) {
      padding: 10px;
    }
    .label {
      font-size: 12px;
      color: #666;
    }
    .value {
      font-size: 20px;
      font-weight: bold;
      margin-top: 4px;
    }
  }
}
.table-row {
  .el-col {
    margin-bottom: 15px;
  }
}
:deep(.el-table) {
  font-size: 12px;
}
.name-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
