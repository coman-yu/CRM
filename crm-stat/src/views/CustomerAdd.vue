<template>
  <div class="customer-add-page">
    <div class="header-bar">
      <h3>新增客户</h3>
    </div>
    <el-card style="max-width: 720px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="客户姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入客户姓名"></el-input>
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>

        <el-form-item label="微信" prop="wechat">
          <el-input
            v-model="form.wechat"
            placeholder="选填，请输入微信号"
          ></el-input>
        </el-form-item>

        <el-form-item label="QQ" prop="qq">
          <el-input v-model="form.qq" placeholder="选填，请输入QQ"></el-input>
        </el-form-item>

        <el-form-item label="所在地" prop="address">
          <el-input
            v-model="form.address"
            placeholder="选填，客户所在城市地区"
          ></el-input>
        </el-form-item>

        <el-form-item label="获客渠道" prop="source">
          <el-select
            v-model="form.source"
            placeholder="请选择获客渠道"
            style="width: 100%"
          >
            <el-option label="抖音" value="抖音"></el-option>
            <el-option label="视频号" value="视频号"></el-option>
            <el-option label="小红书" value="小红书"></el-option>
            <el-option label="其他" value="其他"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="客户备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            placeholder="记录客户情况，选填"
          ></el-input>
        </el-form-item>

        <el-form-item label="客户状态" prop="cust_status">
          <el-select v-model="form.cust_status" style="width: 100%">
            <el-option label="未加上" :value="0"></el-option>
            <el-option label="已加上" :value="1"></el-option>
            <el-option label="同行" :value="2"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="有效状态">
          <el-select v-model="form.validStatus" style="width: 100%">
            <el-option label="未设置" :value="0"></el-option>
            <el-option label="有效" :value="1"></el-option>
            <el-option label="无效" :value="2"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存新增</el-button>
          <el-button @click="goBack">返回列表</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { addCustomerApi } from "@/api/customer";

const router = useRouter();
const formRef = ref(null);

// 当前登录用户（录入人），从sessionStorage拿
const currentUser = ref(
  JSON.parse(sessionStorage.getItem("crm_current_user")) || "",
);

const form = ref({
  name: "",
  phone: "",
  wechat: "",
  qq: "",
  address: "",
  source: "",
  remark: "",
  cust_status: 0,
  validStatus: 0,
});

//表单校验规则：姓名、电话必填；其他选填
const rules = ref({
  name: [{ required: true, message: "客户姓名不能为空", trigger: "blur" }],
  source: [{ required: true, message: "请选择获客渠道", trigger: "change" }],
});

//提交新增
const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      const payload = {
        ...form.value,
        createUser: currentUser.value.username,
        role: currentUser.value.role,
      };
      const res = await addCustomerApi(payload);
      if (res.code === 200) {
        ElMessage.success(res.msg || "新增客户成功");
        form.value = {
          name: "",
          phone: "",
          wechat: "",
          qq: "",
          address: "",
          source: "",
          remark: "",
          cust_status: 0,
          validStatus: 0,
        };
      } else {
        ElMessage.error(res.msg);
      }
    } catch (err) {
      console.error(err);
      ElMessage.error("请求后端失败");
    }
  });
};


// 页面访问权限：仅管理员/中间人可进入新增客户页
onMounted(() => {
  const role = currentUser.value.role;
  if (role !== "admin" && role !== "middleman") {
    ElMessage.error("无权限访问：仅管理员/中间人可新增客户");
    router.push("/dashboard/customerList");
  }
});

const goBack = () => {
  router.push("/dashboard/customerList");
};
</script>

<style scoped lang="scss">
.customer-add-page {
  padding: 16px;
}
.header-bar {
  margin-bottom: 16px;
  h3 {
    margin: 0;
  }
}
</style>
