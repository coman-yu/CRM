<template>
  <div class="customer-assign">
    <div class="header-bar">
      <h3>客户分配（中间人）</h3>
      <div class="header-right">
        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          clearable
          style="width: 130px"
        >
          <el-option label="未加上" :value="0" />
          <el-option label="已加上" :value="1" />
          <el-option label="同行" :value="2" />
        </el-select>
        <el-select
          v-model="saleFilter"
          placeholder="销售筛选"
          clearable
          style="width: 150px"
        >
          <el-option label="未分配" value="unassigned" />
          <el-option
            v-for="s in salesOptions"
            :key="s.username"
            :label="s.username"
            :value="s.username"
          />
        </el-select>
        <el-button type="primary" @click="loadCustomers">刷新</el-button>
      </div>
    </div>

    <el-table :data="pagedData" border stripe max-height="600">
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="客户名称" prop="name" min-width="100" />
      <el-table-column label="电话" prop="phone" width="130" />
      <el-table-column label="来源" prop="source" width="100" />
      <el-table-column label="添加情况" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.cust_status)">
            {{ getStatusText(scope.row.cust_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="有效状态" width="100">
        <template #default="scope">
          <el-tag :type="getValidTagType(scope.row.valid_status)">
            {{ getValidText(scope.row.valid_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="当前运营" width="170">
        <template #default="scope">
          <span v-if="editingId !== scope.row.id">{{
            scope.row.operator_user || "未分配"
          }}</span>
          <el-select
            v-else
            v-model="scope.row.operator_user"
            placeholder="选择运营"
            clearable
            size="small"
            style="width: 150px"
          >
            <el-option
              v-for="o in operatorOptions"
              :key="o.username"
              :label="o.username"
              :value="o.username"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="分配销售" width="200">
        <template #default="scope">
          <!-- 非编辑状态：只读展示 -->
          <span v-if="editingId !== scope.row.id">
            {{ scope.row.sale_user || "未分配" }}
          </span>
          <!-- 编辑状态：显示下拉框 -->
          <el-select
            v-else
            v-model="scope.row.sale_user"
            placeholder="选择销售"
            clearable
            size="small"
            style="width: 150px"
          >
            <el-option
              v-for="s in salesOptions"
              :key="s.username"
              :label="s.username"
              :value="s.username"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="scope">
          <el-button
            v-if="editingId !== scope.row.id"
            type="primary"
            size="small"
            @click="handleEdit(scope.row)"
            >编辑</el-button
          >
          <el-button
            v-if="editingId !== scope.row.id"
            type="danger"
            size="small"
            @click="handleDelete(scope.row)"
            >删除</el-button
          >
          <template v-else>
            <el-button
              type="success"
              size="small"
              @click="handleSave(scope.row)"
              >保存</el-button
            >
            <el-button size="small" @click="handleCancel(scope.row)"
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
      :total="filteredData.length"
      :page-size="50"
      v-model:current-page="currentPage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUser } from "@/composable/useUser";
import {
  getCustomerListApi,
  getSalesListApi,
  getOperatorListApi,
  assignSalesApi,
  deleteCustomerApi,
} from "@/api/customer";

const { userInfo: currentUser } = useUser();

const tableData = ref([]);
const salesOptions = ref([]);
const operatorOptions = ref([]);

// 筛选条件
const statusFilter = ref("");
const saleFilter = ref("");

// 分页：每页50条
const currentPage = ref(1);
const pagedData = computed(() =>
  filteredData.value.slice((currentPage.value - 1) * 50, currentPage.value * 50),
);
// 筛选条件变化时回到第一页
watch([statusFilter, saleFilter], () => {
  currentPage.value = 1;
});

// 正在编辑的行 id，null 表示没有编辑
const editingId = ref(null);
// 备份原始行数据，取消时还原
let backupRow = null;

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

// 前端筛选后的数据
const filteredData = computed(() => {
  return tableData.value.filter((row) => {
    if (
      statusFilter.value !== "" &&
      statusFilter.value !== undefined &&
      Number(row.cust_status) !== Number(statusFilter.value)
    ) {
      return false;
    }
    if (saleFilter.value === "unassigned") {
      if (row.sale_user) return false;
    } else if (saleFilter.value && row.sale_user !== saleFilter.value) {
      return false;
    }
    return true;
  });
});

// 加载销售账号列表
const loadSales = async () => {
  try {
    const res = await getSalesListApi();
    if (res.code === 200) {
      salesOptions.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

// 加载运营账号列表
const loadOperators = async () => {
  try {
    const res = await getOperatorListApi();
    if (res.code === 200) {
      operatorOptions.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

// 加载客户列表（中间人/管理员角色：后端返回全部客户）
const loadCustomers = async () => {
  try {
    const res = await getCustomerListApi(
      currentUser.username,
      currentUser.role,
    );
    if (res.code === 200) {
      tableData.value = res.data;
      currentPage.value = 1;
    } else {
      ElMessage.error(res.msg || "加载客户失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("请求后端失败");
  }
};

// 进入编辑：备份数据
const handleEdit = (row) => {
  editingId.value = row.id;
  backupRow = { ...row };
};

// 保存分配：把客户分配给选中的销售（清空即取消分配）
const handleSave = async (row) => {
  try {
    const res = await assignSalesApi({
      customerId: row.id,
      saleUser: row.sale_user || "",
      operatorUser: row.operator_user || "",
      role: currentUser.role,
    });
    if (res.code === 200) {
      ElMessage.success(res.msg);
      editingId.value = null;
      backupRow = null;
      await loadCustomers();
    } else {
      ElMessage.error(res.msg);
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("请求后端失败");
  }
};

// 取消：恢复备份数据
const handleCancel = (row) => {
  Object.assign(row, backupRow);
  editingId.value = null;
  backupRow = null;
};

// 删除（隐藏）客户记录
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除客户「${row.name}」吗？删除后该记录将不再展示。`,
    "提示",
    { type: "warning" },
  )
    .then(async () => {
      try {
        const res = await deleteCustomerApi({
          customerId: row.id,
          role: currentUser.role,
        });
        if (res.code === 200) {
          ElMessage.success(res.msg);
          await loadCustomers();
        } else {
          ElMessage.error(res.msg);
        }
      } catch (e) {
        console.error(e);
        ElMessage.error("请求后端失败");
      }
    })
    .catch(() => {});
};

onMounted(() => {
  loadSales();
  loadOperators();
  loadCustomers();
});
</script>

<style scoped lang="scss">
.customer-assign {
  padding: 16px;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h3 {
    margin: 0;
  }
  .header-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}
</style>
