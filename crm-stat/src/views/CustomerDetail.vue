<template>
  <div class="customer-detail">
    <!-- 頂部標題+狀態按鈕 -->
    <div class="header-top">
      <div class="title">
        {{ customerInfo.name }}
      </div>
      <div class="tag-group">
        <template v-if="!isEdit">
          <el-button
            size="small"
            :type="customerInfo.importantCustomer ? 'primary' : 'info'"
            plain
            >重要客户<template
              v-if="getTagText('importantCustomer') !== '未设置'"
            >
              · {{ getTagText("importantCustomer") }}</template
            ></el-button
          >
          <el-button
            size="small"
            :type="customerInfo.promoteInvalid ? 'danger' : 'info'"
            plain
            >推广无效<template v-if="getTagText('promoteInvalid') !== '未设置'">
              · {{ getTagText("promoteInvalid") }}</template
            ></el-button
          >
          <el-button
            size="small"
            :type="customerInfo.cLevel ? 'warning' : 'info'"
            plain
            >C档顾客<template v-if="getTagText('cLevel') !== '未设置'">
              · {{ getTagText("cLevel") }}</template
            ></el-button
          >
          <el-button
            size="small"
            :type="customerInfo.validArrive ? 'success' : 'info'"
            plain
            >有效到店<template v-if="getTagText('validArrive') !== '未设置'">
              · {{ getTagText("validArrive") }}</template
            ></el-button
          >
        </template>
        <template v-else>
          <el-select
            v-model="customerInfo.importantCustomer"
            placeholder="重要客户"
            size="small"
            style="width: 130px"
          >
            <el-option label="未设置" :value="0" />
            <el-option label="一般客户" :value="1" />
            <el-option label="重要客户" :value="2" />
            <el-option label="VIP客户" :value="3" />
          </el-select>
          <el-select
            v-model="customerInfo.promoteInvalid"
            placeholder="推广无效"
            size="small"
            style="width: 130px"
          >
            <el-option label="未设置" :value="0" />
            <el-option label="推广有效" :value="1" />
            <el-option label="推广无效" :value="2" />
            <el-option label="待观察" :value="3" />
          </el-select>
          <el-select
            v-model="customerInfo.cLevel"
            placeholder="C档顾客"
            size="small"
            style="width: 130px"
          >
            <el-option label="未分档" :value="0" />
            <el-option label="A档" :value="1" />
            <el-option label="B档" :value="2" />
            <el-option label="C档" :value="3" />
          </el-select>
          <el-select
            v-model="customerInfo.validArrive"
            placeholder="有效到店"
            size="small"
            style="width: 130px"
          >
            <el-option label="未设置" :value="0" />
            <el-option label="未到店" :value="1" />
            <el-option label="已到店" :value="2" />
            <el-option label="有效到店" :value="3" />
          </el-select>
        </template>
      </div>
      <div class="header-btn">
        <el-button
          v-if="!isEdit && currentUser.role !== 'operator'"
          @click="toggleEdit"
          type="primary"
          >编辑</el-button
        >
        <template v-else>
          <el-button
            v-if="currentUser.role !== 'operator'"
            @click="saveData"
            type="success"
            >保存</el-button
          >
          <el-button v-if="currentUser.role !== 'operator'" @click="cancelEdit"
            >取消</el-button
          >
        </template>
      </div>
    </div>

    <!-- 分頁Tab -->
    <el-tabs v-model="activeTab">
      <!-- ============ 基本信息（保持原样） ============ -->
      <el-tab-pane label="基本信息" name="base">
        <!-- 客户信息 -->
        <div class="info-card">
          <div class="card-title">客户信息</div>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <span class="label">姓名：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.name }}</span>
                </template>
                <el-input v-else v-model="customerInfo.name" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">年龄：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.age }}</span>
                </template>
                <el-input v-else v-model="customerInfo.age" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">户籍地：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.registerAddr }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.registerAddr"
                  size="small"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">电话：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.phone }}</span>
                </template>
                <el-input v-else v-model="customerInfo.phone" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">微信：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.wechat }}</span>
                </template>
                <el-input v-else v-model="customerInfo.wechat" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">QQ：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.qq }}</span>
                </template>
                <el-input v-else v-model="customerInfo.qq" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">所在地：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.address }}</span>
                </template>
                <el-input v-else v-model="customerInfo.address" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">获客渠道：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.source }}</span>
                </template>
                <el-select v-else v-model="customerInfo.source" size="small">
                  <el-option label="抖音" value="抖音" />
                  <el-option label="视频号" value="视频号" />
                  <el-option label="小红书" value="小红书" />
                  <el-option label="抖音自然流" value="抖音自然流" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">渠道账户：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.sourceAccount }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.sourceAccount"
                  size="small"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">签约套餐：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.packageName }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.packageName"
                  size="small"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">自/供/代：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.eggType }}</span>
                </template>
                <el-input v-else v-model="customerInfo.eggType" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">推广类型：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.promoteType }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.promoteType"
                  size="small"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">介绍人：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.introducer }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.introducer"
                  size="small"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">录入人：</span>
                <span>{{ customerInfo.createUser }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">运营人员：</span>
                <template v-if="!isEdit || !canEditOperator">
                  <span>{{ customerInfo.opUser || "-" }}</span>
                </template>
                <el-select
                  v-else
                  v-model="customerInfo.opUser"
                  size="small"
                  placeholder="选择运营"
                  style="width: 100%"
                >
                  <el-option
                    v-for="op in operatorList"
                    :key="op.username"
                    :label="op.username"
                    :value="op.username"
                  />
                </el-select>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">录入时间：</span>
                <el-date-picker
                  v-model="customerInfo.createTime"
                  type="date"
                  placeholder="录入时间："
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                  disabled
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">到店时间：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.arriveTime }}</span>
                </template>
                <el-date-picker
                  v-else
                  v-model="customerInfo.arriveTime"
                  type="date"
                  placeholder="到店时间："
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">回访时间：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.visitTime }}</span>
                </template>
                <el-date-picker
                  v-else
                  v-model="customerInfo.visitTime"
                  type="date"
                  placeholder="回访时间："
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">下次回访时间：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.nextVisit }}</span>
                </template>
                <el-date-picker
                  v-else
                  v-model="customerInfo.nextVisit"
                  type="date"
                  placeholder="下次回访时间："
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">最新跟进时间：</span>
                <el-date-picker
                  v-model="customerInfo.lastFollowTime"
                  type="date"
                  placeholder="最新跟进时间："
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                  disabled
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">首次签约时间：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.firstSignTime }}</span>
                </template>
                <el-date-picker
                  v-else
                  v-model="customerInfo.firstSignTime"
                  type="date"
                  placeholder="首次签约时间："
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <span class="label">最新签约时间：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.latestSignTime }}</span>
                </template>
                <el-date-picker
                  v-else
                  v-model="customerInfo.latestSignTime"
                  type="date"
                  placeholder="最新签约时间："
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="16">
              <div class="info-item">
                <span class="label">更多联系方式：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.moreContact }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.moreContact"
                  size="small"
                />
              </div>
            </el-col>
            <el-col :span="24">
              <div class="info-item">
                <span class="label">SEM落地页：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.semPage }}</span>
                </template>
                <el-input v-else v-model="customerInfo.semPage" size="small" />
              </div>
            </el-col>
            <el-col :span="24">
              <div class="info-item">
                <span class="label">客户备注：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.remark }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.remark"
                  size="small"
                  type="textarea"
                  rows="3"
                />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 服務信息 -->
        <div class="info-card">
          <div class="card-title">服务信息</div>
          <el-row :gutter="20">
            <el-col :span="4">
              <div class="info-item">
                <span class="label">业务员：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.sales }}</span>
                </template>
                <el-input v-else v-model="customerInfo.sales" size="small" />
              </div>
            </el-col>
            <el-col :span="4">
              <div class="info-item">
                <span class="label">现场经理：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.manager }}</span>
                </template>
                <el-input v-else v-model="customerInfo.manager" size="small" />
              </div>
            </el-col>
            <el-col :span="4">
              <div class="info-item">
                <span class="label">运营人员：</span>
                <template v-if="!isEdit || !canEditOperator">
                  <span>{{ customerInfo.opUser || "-" }}</span>
                </template>
                <el-select
                  v-else
                  v-model="customerInfo.opUser"
                  size="small"
                  placeholder="选择运营"
                  style="width: 100%"
                >
                  <el-option
                    v-for="op in operatorList"
                    :key="op.username"
                    :label="op.username"
                    :value="op.username"
                  />
                </el-select>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="info-item">
                <span class="label">医疗客服：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.medService }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.medService"
                  size="small"
                />
              </div>
            </el-col>
            <el-col :span="4">
              <div class="info-item">
                <span class="label">妹子客服：</span>
                <template v-if="!isEdit">
                  <span>{{ customerInfo.girlService }}</span>
                </template>
                <el-input
                  v-else
                  v-model="customerInfo.girlService"
                  size="small"
                />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 跟進階段 -->
        <div class="info-card">
          <div class="card-title">跟进阶段</div>
          <div class="info-item">
            <span class="label">添加情况：</span>
            <template v-if="!isEdit">
              <el-tag :type="getStatusTagType(customerInfo.cust_status)">
                {{ getStatusText(customerInfo.cust_status) }}
              </el-tag>
            </template>
            <el-select
              v-else
              v-model="customerInfo.cust_status"
              size="small"
              style="width: 120px"
            >
              <el-option label="未加上" :value="0" />
              <el-option label="已加上" :value="1" />
              <el-option label="同行" :value="2" />
            </el-select>
          </div>
          <div class="info-item">
            <span class="label">有效状态：</span>
            <template v-if="!isEdit">
              <el-tag :type="getValidTagType(customerInfo.validStatus)">
                {{ getValidText(customerInfo.validStatus) }}
              </el-tag>
            </template>
            <el-select
              v-else
              v-model="customerInfo.validStatus"
              size="small"
              style="width: 120px"
            >
              <el-option label="未设置" :value="0" />
              <el-option label="有效" :value="1" />
              <el-option label="无效" :value="2" />
            </el-select>
          </div>
        </div>

        <!-- 服務階段 -->
        <div class="info-card">
          <div class="card-title">服务阶段</div>
          <div class="info-item">
            <template v-if="!isEdit">
              <el-tag type="info" v-if="customerInfo.serviceStage">{{
                customerInfo.serviceStage
              }}</el-tag>
            </template>
            <el-select v-else v-model="customerInfo.serviceStage">
              <el-option label="未设置" value="未设置" />
              <el-option label="咨询中" value="咨询中" />
              <el-option label="调理中" value="调理中" />
              <el-option label="移植阶段" value="移植阶段" />
            </el-select>
          </div>
        </div>
      </el-tab-pane>

      <!-- ============ 其余 tab：文本框占位 + 独立编辑保存 ============ -->
      <el-tab-pane
        v-for="tab in tabConfigs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
      >
        <div class="info-card">
          <div class="card-title tab-title">
            <span>{{ tab.label }}</span>
          </div>
          <el-row :gutter="20">
            <el-col v-for="f in tab.fields" :key="f.key" :span="f.span || 8">
              <div class="info-item">
                <span class="label">{{ f.label }}：</span>
                <template v-if="!isEdit">
                  <span>{{ tabData[tab.key][f.key] || "-" }}</span>
                </template>
                <el-date-picker
                  v-else-if="f.type === 'date'"
                  v-model="tabData[tab.key][f.key]"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
                <el-input
                  v-else-if="f.type === 'textarea'"
                  v-model="tabData[tab.key][f.key]"
                  type="textarea"
                  :rows="3"
                  size="small"
                  style="width: 100%"
                />
                <el-input
                  v-else
                  v-model="tabData[tab.key][f.key]"
                  size="small"
                />
              </div>
            </el-col>
          </el-row>

          <!-- 检查报告：图片上传 / 查看 -->
          <template v-if="tab.key === 'report'">
            <div class="report-images">
              <el-upload
                v-if="isEdit"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="handleReportUpload"
              >
                <el-button type="primary" size="small">上传图片</el-button>
              </el-upload>
              <div
                class="img-grid"
                v-if="tabData.report.images && tabData.report.images.length > 0"
              >
                <div
                  class="img-item"
                  v-for="(img, idx) in tabData.report.images"
                  :key="idx"
                >
                  <el-image
                    :src="img.url"
                    :preview-src-list="reportImageList"
                    :initial-index="idx"
                    fit="cover"
                    class="report-img"
                  />
                  <el-button
                    v-if="isEdit"
                    class="img-del"
                    type="danger"
                    size="mini"
                    circle
                    @click="removeReportImage(idx)"
                    >×</el-button
                  >
                </div>
              </div>
              <div v-else class="img-empty">暂无检查报告图片</div>
            </div>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getCustomerDetailApi,
  updateCustomerApi,
  getOperatorListApi,
} from "@/api/customer";
import { useUser } from "@/composable/useUser";

const route = useRoute();
const { userInfo: currentUser } = useUser();
const activeTab = ref("base");
const isEdit = ref(false);
let backupData = null; // 基本信息编辑前备份，取消恢复

// 运营人员下拉框选项（仅 admin / middleman 可修改）
const operatorList = ref([]);
const canEditOperator = computed(
  () => currentUser.role === "admin" || currentUser.role === "middleman",
);
const loadOperatorList = async () => {
  try {
    const res = await getOperatorListApi();
    if (res.code === 200) {
      operatorList.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const customerInfo = ref({});

// ===================== 其余 tab 配置（占位字段） =====================
const tabConfigs = [
  {
    key: "follow",
    label: "跟进记录",
    fields: [
      { key: "followTime", label: "跟进时间", type: "date" },
      { key: "followType", label: "跟进方式", type: "text" },
      { key: "followContent", label: "跟进内容", type: "textarea", span: 24 },
      { key: "nextFollowTime", label: "下次跟进时间", type: "date" },
    ],
  },
  {
    key: "treat",
    label: "诊疗记录",
    fields: [
      { key: "treatDate", label: "诊疗日期", type: "date" },
      { key: "doctor", label: "主治医生", type: "text" },
      { key: "diagnosis", label: "诊断结果", type: "textarea", span: 24 },
      { key: "treatment", label: "治疗方案", type: "textarea", span: 24 },
    ],
  },
  {
    key: "report",
    label: "检查报告",
    fields: [
      { key: "reportName", label: "报告名称", type: "text" },
      { key: "reportDate", label: "检查日期", type: "date" },
      { key: "reportResult", label: "检查结果", type: "textarea", span: 24 },
    ],
  },
  {
    key: "order",
    label: "销售订单",
    fields: [
      { key: "orderNo", label: "订单编号", type: "text" },
      { key: "orderAmount", label: "订单金额", type: "text" },
      { key: "orderStatus", label: "订单状态", type: "text" },
      { key: "orderDate", label: "下单日期", type: "date" },
    ],
  },
  {
    key: "payment",
    label: "回款信息",
    fields: [
      { key: "paymentAmount", label: "回款金额", type: "text" },
      { key: "paymentDate", label: "回款日期", type: "date" },
      { key: "paymentMethod", label: "回款方式", type: "text" },
      { key: "paymentRemark", label: "备注", type: "textarea", span: 24 },
    ],
  },
  {
    key: "contract",
    label: "合同信息",
    fields: [
      { key: "contractNo", label: "合同编号", type: "text" },
      { key: "contractAmount", label: "合同金额", type: "text" },
      { key: "signDate", label: "签订日期", type: "date" },
      { key: "contractStatus", label: "合同状态", type: "text" },
    ],
  },
  {
    key: "track",
    label: "客户轨迹",
    fields: [
      { key: "trackType", label: "轨迹类型", type: "text" },
      { key: "trackTime", label: "发生时间", type: "date" },
      { key: "trackContent", label: "轨迹内容", type: "textarea", span: 24 },
    ],
  },
  {
    key: "line",
    label: "线索记录",
    fields: [
      { key: "lineSource", label: "线索来源", type: "text" },
      { key: "lineStatus", label: "线索状态", type: "text" },
      { key: "lineTime", label: "登记时间", type: "date" },
      { key: "lineDesc", label: "线索描述", type: "textarea", span: 24 },
    ],
  },
];

// tab 数据（暂存 localStorage，占位实现，后续可接后端）
const tabData = ref({});
tabConfigs.forEach((t) => {
  const init = {};
  t.fields.forEach((f) => {
    init[f.key] = "";
  });
  if (t.key === "report") init.images = [];
  tabData.value[t.key] = init;
});

const tabStorageKey = () => `crm_customer_tabs_${route.params.id}`;

const loadTabData = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(tabStorageKey()));
    if (saved) {
      tabConfigs.forEach((t) => {
        if (saved[t.key]) {
          tabData.value[t.key] = {
            ...tabData.value[t.key],
            ...saved[t.key],
          };
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
};
const saveTabData = () => {
  localStorage.setItem(tabStorageKey(), JSON.stringify(tabData.value));
};

// 全局编辑时 tab 数据备份（统一由右上角编辑/保存/取消控制）
let backupTab = null;

// ===================== 检查报告：图片上传/查看 =====================
const reportImageList = computed(() =>
  (tabData.value.report.images || []).map((img) => img.url),
);

const handleReportUpload = (file) => {
  if (!file || !file.raw) return;
  if (!file.raw.type.startsWith("image/")) {
    ElMessage.warning("请上传图片文件");
    return;
  }
  if (file.raw.size > 5 * 1024 * 1024) {
    ElMessage.warning("图片不能超过 5MB");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    tabData.value.report.images.push({
      name: file.name,
      url: e.target.result,
    });
    saveTabData();
    ElMessage.success("图片已上传");
  };
  reader.readAsDataURL(file.raw);
};

const removeReportImage = (idx) => {
  tabData.value.report.images.splice(idx, 1);
  saveTabData();
};

// ===================== 基本信息（保持原逻辑） =====================
// 載入详情
async function loadDetail() {
  const id = route.params.id;
  const res = await getCustomerDetailApi({ id });
  if (res.code === 200) {
    customerInfo.value = res.data;
  } else {
    ElMessage.error(res.msg);
  }
}

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

// 标签值 -> 文本映射（与下拉框选项一致）
const tagTextMap = {
  importantCustomer: ["未设置", "一般客户", "重要客户", "VIP客户"],
  promoteInvalid: ["未设置", "推广有效", "推广无效", "待观察"],
  cLevel: ["未分档", "A档", "B档", "C档"],
  validArrive: ["未设置", "未到店", "已到店", "有效到店"],
};
const getTagText = (key) => {
  const val = customerInfo.value[key];
  const arr = tagTextMap[key];
  return arr && arr[val] !== undefined ? arr[val] : "未设置";
};
// 開啟編輯（统一入口，备份基本信息 + tab 数据）
const toggleEdit = () => {
  backupData = JSON.parse(JSON.stringify(customerInfo.value));
  backupTab = JSON.parse(JSON.stringify(tabData.value));
  isEdit.value = true;
};
// 保存（统一入口：tab 数据 + 基本信息 + 标签）
const saveData = async () => {
  saveTabData();
  const res = await updateCustomerApi(customerInfo.value);
  if (res.code === 200) {
    ElMessage.success("保存成功");
    isEdit.value = false;
    backupData = null;
    backupTab = null;
  } else {
    ElMessage.error(res.msg || "保存失败");
  }
};
// 取消編輯，回滚（基本信息 + tab 数据）
const cancelEdit = () => {
  customerInfo.value = JSON.parse(JSON.stringify(backupData));
  tabData.value = JSON.parse(JSON.stringify(backupTab));
  isEdit.value = false;
};

onMounted(() => {
  loadDetail();
  loadTabData();
  loadOperatorList();
});
</script>

<style scoped>
.customer-detail {
  padding: 16px;
}
.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.title {
  font-size: 20px;
  font-weight: bold;
  color: #2478d8;
  white-space: nowrap;
}
.tag-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.header-btn {
  margin-left: auto;
}
.info-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  margin-top: 12px;
  background: #fff;
}
.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #2478d8;
  margin-bottom: 12px;
  border-left: 4px solid #2478d8;
  padding-left: 8px;
}
.tab-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-item {
  padding: 6px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.label {
  color: #666;
  margin-right: 4px;
  white-space: nowrap;
}
/* 检查报告图片区 */
.report-images {
  margin-top: 12px;
  border-top: 1px dashed #e4e7ed;
  padding-top: 12px;
}
.img-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}
.img-item {
  position: relative;
  width: 120px;
  height: 120px;
}
.report-img {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
}
.img-del {
  position: absolute;
  top: -6px;
  right: -6px;
}
.img-empty {
  color: #999;
  font-size: 13px;
  padding: 8px 0;
}
</style>
