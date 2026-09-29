<template>
  <div class="member-input">
    <div class="header-bar">
      <h3>{{ currentMemberName }} - 数据录入</h3>
      <div class="header-right">
        <el-date-picker
          v-model="memberInputDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        ></el-date-picker>
        <el-button @click="backToMain">返回运营统计</el-button>
      </div>
    </div>
    <el-card style="max-width: 600px">
      <el-form label-width="100px">
        <el-form-item label="表单数量">
          <el-input-number
            v-model="memberInput.form"
            :min="0"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="到店人数">
          <el-input-number
            v-model="memberInput.shop"
            :min="0"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="有效人数">
          <el-input-number
            v-model="memberInput.valid"
            :min="0"
            style="width: 200px"
            disabled
          />
          <span class="valid-tip">（系统根据客户有效状态自动统计）</span>
        </el-form-item>
        <el-form-item label="签约数量">
          <el-input-number
            v-model="memberInput.sign"
            :min="0"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitMemberData"
            >提交数据</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { statListApi, statSaveApi } from "@/api/stat";
import dayjs from "dayjs";

const route = useRoute();
const router = useRouter();

// 组员用户名取自路由参数
const currentMemberName = ref(route.params.username);

// 录入日期（默认今天）
const memberInputDate = ref(dayjs().format("YYYY-MM-DD"));
const memberInput = ref({ form: 0, shop: 0, valid: 0, sign: 0 });

// 加载该组员某天的数据
const loadMemberDayData = async (date) => {
  const userName = currentMemberName.value;
  try {
    const res = await statListApi(userName, date, date);
    if (res.code === 200 && res.data.length > 0) {
      const day = res.data[0];
      memberInput.value = {
        form: day.form,
        shop: day.shop,
        valid: day.valid,
        sign: day.sign,
      };
    } else {
      memberInput.value = { form: 0, shop: 0, valid: 0, sign: 0 };
    }
  } catch (e) {
    console.error("加载组员单日数据失败：", e);
  }
};

// 日期变化时重新加载
watch(memberInputDate, async () => {
  loadMemberDayData(memberInputDate.value);
});

// 路由参数变化时切换组员：更新标题并加载该成员数据
watch(
  () => route.params.username,
  (newName) => {
    if (newName) {
      currentMemberName.value = newName;
      loadMemberDayData(memberInputDate.value);
    }
  },
);

// 提交组员录入数据
const submitMemberData = async () => {
  const name = currentMemberName.value;
  const date = memberInputDate.value;
  try {
    const res = await statSaveApi({
      username: name,
      date: date,
      form: memberInput.value.form,
      shop: memberInput.value.shop,
      sign: memberInput.value.sign,
    });
    if (res.code === 200) {
      ElMessage.success("数据提交成功，已保存");
    } else {
      ElMessage.error(res.msg || "提交失败");
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("请求后端失败，请检查服务是否启动");
  }
};

// 返回主页面
const backToMain = () => {
  router.push("/dashboard/stat");
};

onMounted(() => {
  loadMemberDayData(memberInputDate.value);
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
  }
}
.valid-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}
</style>
