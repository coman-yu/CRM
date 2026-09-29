<template>
  <div class="customer-page">
    <h2>我的客户列表</h2>
    <el-table :data="pagedTableData" border stripe max-height="600px">
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="创建日期" width="110">
        <template #default="scope">
          {{ scope.row.create_time ? scope.row.create_time.slice(0, 10) : "-" }}
        </template>
      </el-table-column>
      <el-table-column label="客户名称">
        <template #default="scope">
          <span v-if="editingId !== scope.row.id || currentUser.role === 'sales'">{{ scope.row.name }}</span>
          <el-input v-else-if="currentUser.role !== 'sales'" v-model="scope.row.name" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="电话">
        <template #default="scope">
          <span v-if="editingId !== scope.row.id || currentUser.role === 'sales'">{{ scope.row.phone }}</span>
          <el-input v-else-if="currentUser.role !== 'sales'" v-model="scope.row.phone" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="微信">
        <template #default="scope">
          <span v-if="editingId !== scope.row.id || currentUser.role === 'sales'">{{ scope.row.wechat }}</span>
          <el-input v-else-if="currentUser.role !== 'sales'" v-model="scope.row.wechat" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="QQ">
        <template #default="scope">
          <span v-if="editingId !== scope.row.id || currentUser.role === 'sales'">{{ scope.row.qq }}</span>
          <el-input v-else-if="currentUser.role !== 'sales'" v-model="scope.row.qq" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="地址">
        <template #default="scope">
          <span v-if="editingId !== scope.row.id || currentUser.role === 'sales'">{{ scope.row.address }}</span>
          <el-input v-else-if="currentUser.role !== 'sales'" v-model="scope.row.address" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="来源">
        <template #default="scope">
          <span v-if="editingId !== scope.row.id || currentUser.role === 'sales'">{{ scope.row.source }}</span>
          <el-select
            v-else-if="currentUser.role !== 'sales'"
            v-model="scope.row.source"
            size="small"
            placeholder="请选择获客渠道"
          >
            <el-option label="抖音" value="抖音" />
            <el-option label="视频号" value="视频号" />
            <el-option label="小红书" value="小红书" />
            <el-option label="其他" value="其他" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="添加情况">
        <template #default="scope">
          <el-tag
            v-if="editingId !== scope.row.id"
            :type="getStatusTagType(scope.row.cust_status)"
          >
            {{ getStatusText(scope.row.cust_status) }}
          </el-tag>
          <el-select v-else v-model="scope.row.cust_status" size="small">
            <el-option label="未加上" :value="0" />
            <el-option label="已加上" :value="1" />
            <el-option label="同行" :value="2" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="有效状态">
        <template #default="scope">
          <el-tag
            v-if="editingId !== scope.row.id"
            :type="getValidTagType(scope.row.valid_status)"
          >
            {{ getValidText(scope.row.valid_status) }}
          </el-tag>
          <el-select v-else v-model="scope.row.valid_status" size="small">
            <el-option label="未设置" :value="0" />
            <el-option label="有效" :value="1" />
            <el-option label="无效" :value="2" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="对接销售" prop="sale_user" />
      <el-table-column label="运营组员" prop="operator_user" />
      <el-table-column label="客户跟进情况" width="240">
        <template #default="scope">
          <div v-if="editingId !== scope.row.id" class="follow-cell">
            {{ scope.row.remark }}
          </div>
          <el-input v-else v-model="scope.row.remark" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button
            v-if="editingId !== scope.row.id && currentUser.role !== 'operator'"
            @click="handleEdit(scope.row)"
            type="primary"
            size="small"
            >编辑</el-button
          >
          <el-button
            v-if="editingId !== scope.row.id"
            @click="goDetail(scope.row)"
            type="info"
            size="small"
            >详情</el-button
          >
          <template v-else>
            <el-button
              v-if="currentUser.role !== 'operator'"
              @click="handleSave(scope.row)"
              type="success"
              size="small"
              >保存</el-button
            >
            <el-button
              v-if="currentUser.role !== 'operator'"
              @click="handleCancel(scope.row)"
              size="small"
              >取消</el-button
            >
          </template>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      style="margin-top: 12px; justify-content: flex-end"
      background
      layout="total, prev, pager, next, jumper"
      :total="tableData.length"
      :page-size="50"
      v-model:current-page="currentPage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUser } from "@/composable/useUser";
import { getCustomerListApi, updateCustomerApi } from "@/api/customer";
import { ElMessage } from "element-plus";

const router = useRouter();
const { userInfo: currentUser } = useUser();
const tableData = ref([]);
// 分页：每页50条
const currentPage = ref(1);
const pagedTableData = computed(() =>
  tableData.value.slice((currentPage.value - 1) * 50, currentPage.value * 50),
);
// 正在編輯行id，null代表沒有編輯
const editingId = ref(null);
// 備份原始行數據，取消時還原
let backupRow = null;

// 狀態文字
const getStatusText = (val) => {
  switch (val) {
    case 0:
      return "未加上";
    case 1:
      return "已加上";
    case 2:
      return "同行";
    default:
      return "未知";
  }
};
const getStatusTagType = (val) => {
  switch (val) {
    case 0:
      return "info";
    case 1:
      return "success";
    case 2:
      return "warning";
    default:
      return "";
  }
};

// 有效状态映射
const getValidText = (val) => {
  switch (val) {
    case 1:
      return "有效";
    case 2:
      return "无效";
    default:
      return "未设置";
  }
};
const getValidTagType = (val) => {
  switch (val) {
    case 1:
      return "success";
    case 2:
      return "danger";
    default:
      return "info";
  }
};

// 進入編輯，備份數據
const handleEdit = (row) => {
  editingId.value = row.id;
  backupRow = { ...row };
};

// 跳轉到客戶詳情，把該客戶 id 作為路由參數傳過去
const goDetail = (row) => {
  router.push(`/dashboard/customer/${row.id}`);
};

// 保存
const handleSave = async (row) => {
  const res = await updateCustomerApi({
    id: row.id,
    name: row.name,
    phone: row.phone,
    wechat: row.wechat,
    qq: row.qq,
    address: row.address,
    source: row.source,
    remark: row.remark,
    cust_status: row.cust_status,
    valid_status: row.valid_status,
  });
  if (res.code === 200) {
    editingId.value = null;
    backupRow = null;
    ElMessage.success("保存成功");
  } else {
    ElMessage.error(res.msg || "保存失敗");
  }
};
// 取消，恢復備份數據
const handleCancel = (row) => {
  Object.assign(row, backupRow);
  editingId.value = null;
  backupRow = null;
};

// 載入列表
async function loadCustomer() {
  const res = await getCustomerListApi(currentUser.username, currentUser.role);
  if (res.code === 200) {
    tableData.value = res.data;
    currentPage.value = 1;
  }
}
onMounted(() => {
  loadCustomer();
});
</script>
<style scoped>
.customer-page {
  padding: 20px;
}
.follow-cell {
  max-width: 240px;
  white-space: nowrap;
  overflow-x: auto;
}
</style>
