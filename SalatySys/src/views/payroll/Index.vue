<template>
  <div class="payroll-container">
    <div class="page-header">
      <h2 class="page-title">工资单</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          class="month-picker"
        />
        <el-button type="primary" @click="generatePayroll" :loading="loading">
          生成工资单
        </el-button>
      </div>
    </div>
    
    <!-- 工资单卡片 -->
    <div v-if="hasPayrollData" class="payroll-content">
      <el-card class="payroll-card">
        <template #header>
          <div class="payroll-header">
            <h3 class="payroll-title">{{ payrollData.month }} 工资单</h3>
            <div class="payroll-total">总收入: {{ payrollData.totalIncome }}元</div>
          </div>
        </template>
        
        <div class="payroll-body">
          <!-- 基本信息 -->
          <div class="info-section">
            <h4 class="section-title">基本信息</h4>
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="info-item">
                  <div class="info-label">姓名</div>
                  <div class="info-value">{{ payrollData.basicInfo.name }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="info-item">
                  <div class="info-label">工号</div>
                  <div class="info-value">{{ payrollData.basicInfo.employeeId }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="info-item">
                  <div class="info-label">部门</div>
                  <div class="info-value">{{ payrollData.basicInfo.department }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="info-item">
                  <div class="info-label">职位</div>
                  <div class="info-value">{{ payrollData.basicInfo.position }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <!-- 收入明细 -->
          <div class="income-section">
            <h4 class="section-title">收入明细</h4>
            <el-table :data="payrollData.incomeItems" border style="width: 100%">
              <el-table-column prop="name" label="项目" width="180" />
              <el-table-column prop="amount" label="金额(元)" width="120">
                <template #default="{ row }">
                  <span class="income-amount">{{ row.amount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" />
            </el-table>
            <div class="section-summary">
              收入合计: <span class="income-total">{{ payrollData.totalIncome }}元</span>
            </div>
          </div>
          
          <!-- 扣除项目 -->
          <div class="deduction-section">
            <h4 class="section-title">扣除项目</h4>
            <el-table :data="payrollData.deductionItems" border style="width: 100%">
              <el-table-column prop="name" label="项目" width="180" />
              <el-table-column prop="amount" label="金额(元)" width="120">
                <template #default="{ row }">
                  <span class="deduction-amount">{{ row.amount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" />
            </el-table>
            <div class="section-summary">
              扣除合计: <span class="deduction-total">{{ payrollData.totalDeduction }}元</span>
            </div>
          </div>
          
          <!-- 实发工资 -->
          <div class="net-pay-section">
            <div class="net-pay-label">实发工资</div>
            <div class="net-pay-value">{{ payrollData.netPay }}元</div>
          </div>
        </div>
        
        <div class="payroll-footer">
          <el-button type="primary" @click="printPayroll">
            <el-icon><Printer /></el-icon>
            打印
          </el-button>
          <el-button type="success" @click="exportPDF">
            <el-icon><Document /></el-icon>
            导出PDF
          </el-button>
        </div>
      </el-card>
      
      <!-- 历史工资单 -->
      <el-card class="history-card">
        <template #header>
          <div class="card-header">
            <span>历史工资单</span>
          </div>
        </template>
        <el-table :data="payrollHistory" style="width: 100%">
          <el-table-column prop="month" label="月份" width="120" />
          <el-table-column prop="totalIncome" label="总收入(元)" width="120" />
          <el-table-column prop="totalDeduction" label="总扣除(元)" width="120" />
          <el-table-column prop="netPay" label="实发工资(元)" width="120" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" text @click="viewHistoryPayroll(row)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <!-- 无数据提示 -->
    <el-empty v-else description="暂无工资单数据，请选择月份生成工资单" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useWorktimeStore } from '@/store/worktime'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { Printer, Document } from '@element-plus/icons-vue'

const worktimeStore = useWorktimeStore()
const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 选中的月份
const selectedMonth = ref('')

// 工资单数据
const payrollData = reactive({
  month: '',
  basicInfo: {
    name: '',
    employeeId: '',
    department: '',
    position: ''
  },
  incomeItems: [],
  deductionItems: [],
  totalIncome: 0,
  totalDeduction: 0,
  netPay: 0
})

// 历史工资单
const payrollHistory = ref([])

// 是否有工资单数据
const hasPayrollData = computed(() => {
  return payrollData.month !== ''
})

// 生成工资单
const generatePayroll = () => {
  if (!selectedMonth.value) {
    ElMessage.warning('请选择月份')
    return
  }
  
  loading.value = true
  
  // 模拟异步操作
  setTimeout(() => {
    try {
      // 这里应该是实际的工资单生成逻辑
      // 为了演示，使用模拟数据
      generateMockPayrollData()
      
      ElMessage.success('工资单生成成功')
    } catch (error) {
      ElMessage.error('工资单生成失败：' + error.message)
    } finally {
      loading.value = false
    }
  }, 1000)
}

// 生成模拟工资单数据
const generateMockPayrollData = () => {
  // 格式化月份显示
  const [year, month] = selectedMonth.value.split('-')
  payrollData.month = `${year}年${month}月`
  
  // 基本信息
  payrollData.basicInfo = {
    name: userStore.userInfo.name || '张三',
    employeeId: 'EMP001',
    department: '教学部',
    position: '教师'
  }
  
  // 收入项目
  payrollData.incomeItems = [
    { name: '基本工资', amount: 3000, description: '固定基本工资' },
    { name: '课时费', amount: 5000, description: '根据本月工时计算' },
    { name: '绩效奖金', amount: 1000, description: '教学质量评估奖金' }
  ]
  
  // 扣除项目
  payrollData.deductionItems = [
    { name: '个人所得税', amount: 300, description: '按税率计算' },
    { name: '社保', amount: 400, description: '社会保险个人缴纳部分' },
    { name: '公积金', amount: 300, description: '住房公积金个人缴纳部分' }
  ]
  
  // 计算合计
  payrollData.totalIncome = payrollData.incomeItems.reduce((sum, item) => sum + item.amount, 0)
  payrollData.totalDeduction = payrollData.deductionItems.reduce((sum, item) => sum + item.amount, 0)
  payrollData.netPay = payrollData.totalIncome - payrollData.totalDeduction
  
  // 更新历史工资单
  const existingIndex = payrollHistory.value.findIndex(item => item.month === payrollData.month)
  
  if (existingIndex !== -1) {
    payrollHistory.value[existingIndex] = {
      month: payrollData.month,
      totalIncome: payrollData.totalIncome,
      totalDeduction: payrollData.totalDeduction,
      netPay: payrollData.netPay
    }
  } else {
    payrollHistory.value.push({
      month: payrollData.month,
      totalIncome: payrollData.totalIncome,
      totalDeduction: payrollData.totalDeduction,
      netPay: payrollData.netPay
    })
  }
  
  // 按月份降序排序
  payrollHistory.value.sort((a, b) => {
    return b.month.localeCompare(a.month)
  })
}

// 查看历史工资单
const viewHistoryPayroll = (row) => {
  selectedMonth.value = row.month.replace('年', '-').replace('月', '')
  generatePayroll()
}

// 打印工资单
const printPayroll = () => {
  window.print()
}

// 导出PDF
const exportPDF = () => {
  ElMessage.success('PDF导出功能将在后续版本中实现')
}

// 组件挂载后初始化
onMounted(() => {
  // 设置当前月份
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  selectedMonth.value = `${year}-${month}`
  
  // 加载历史工资单
  // 这里应该是实际的加载逻辑
  // 为了演示，使用模拟数据
  payrollHistory.value = [
    { month: '2023年02月', totalIncome: 9000, totalDeduction: 1000, netPay: 8000 },
    { month: '2023年01月', totalIncome: 8500, totalDeduction: 950, netPay: 7550 },
    { month: '2022年12月', totalIncome: 9500, totalDeduction: 1050, netPay: 8450 }
  ]
})
</script>

<style scoped>
.payroll-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

.month-picker {
  margin-right: 16px;
}

.payroll-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.payroll-card {
  margin-bottom: 20px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.payroll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payroll-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.payroll-total {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
}

.payroll-body {
  padding: 20px 0;
}

.section-title {
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #EBEEF5;
}

.info-section,
.income-section,
.deduction-section {
  margin-bottom: 24px;
}

.info-item {
  margin-bottom: 16px;
}

.info-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.section-summary {
  margin-top: 16px;
  text-align: right;
  font-size: 16px;
  font-weight: 500;
}

.income-amount,
.income-total {
  color: #67C23A;
}

.deduction-amount,
.deduction-total {
  color: #F56C6C;
}

.net-pay-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed #EBEEF5;
}

.net-pay-label {
  font-size: 18px;
  font-weight: 500;
  margin-right: 16px;
}

.net-pay-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.payroll-footer {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.history-card {
  margin-bottom: 20px;
}

@media print {
  .page-header,
  .payroll-footer,
  .history-card {
    display: none;
  }
  
  .payroll-card {
    box-shadow: none;
    margin: 0;
    padding: 0;
  }
}
</style> 