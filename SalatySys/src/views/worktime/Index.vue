<template>
  <div class="worktime-container">
    <div class="page-header">
      <h2 class="page-title">工时录入</h2>
      <el-button type="primary" @click="openAddDialog">新增工时</el-button>
    </div>
    
    <!-- 月历视图 -->
    <div class="calendar-container">
      <div class="calendar-header">
        <el-button-group>
          <el-button @click="prevMonth">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button @click="nextMonth">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
        <span class="current-month">{{ currentYearMonth }}</span>
      </div>
      
      <div class="calendar-grid">
        <!-- 星期标题 -->
        <div class="weekday-header" v-for="day in weekdays" :key="day">
          {{ day }}
        </div>
        
        <!-- 日期单元格 -->
        <div 
          v-for="{ date, day, currentMonth, hasRecord, record } in calendarDays" 
          :key="date.toISOString()"
          class="day-cell"
          :class="{ 
            'other-month': !currentMonth, 
            'today': isToday(date),
            'has-record': hasRecord
          }"
        >
          <div class="day-number">{{ day }}</div>
          
          <template v-if="currentMonth">
            <div v-if="hasRecord" class="record-info">
              <el-tag size="small" type="success">{{ record.hours }}小时</el-tag>
              <div class="income">{{ record.income }}元</div>
              <el-button 
                type="primary" 
                size="small" 
                text
                @click="editRecord(record)"
              >
                编辑
              </el-button>
            </div>
            
            <div v-else-if="isPast(date)" class="no-record">
              <el-button 
                type="primary" 
                size="small" 
                plain
                @click="addRecordForDate(date)"
              >
                补录
              </el-button>
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <!-- 本月汇总 -->
    <el-card class="summary-card">
      <template #header>
        <div class="card-header">
          <span>本月工时汇总</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">总工时</div>
            <div class="summary-value">{{ monthSummary.totalHours || 0 }}</div>
            <div class="summary-unit">小时</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">总收入</div>
            <div class="summary-value">{{ monthSummary.totalIncome || 0 }}</div>
            <div class="summary-unit">元</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">平均课时费</div>
            <div class="summary-value">{{ monthSummary.averageRate || 0 }}</div>
            <div class="summary-unit">元/时</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">已录入天数</div>
            <div class="summary-value">{{ monthSummary.recordDays || 0 }}</div>
            <div class="summary-unit">天</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 工时录入对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑工时记录' : '新增工时记录'"
      width="600px"
    >
      <el-form 
        ref="recordFormRef"
        :model="recordForm"
        :rules="recordRules"
        label-width="100px"
      >
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="recordForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY年MM月DD日"
            value-format="YYYY-MM-DD"
            :disabled="isEdit"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="课程类型" prop="courseTypeId">
          <el-select
            v-model="recordForm.courseTypeId"
            placeholder="选择课程类型"
            style="width: 100%"
          >
            <el-option-group
              v-for="group in courseTypeGroups"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="item in group.options"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        
        <el-form-item label="工时" prop="hours">
          <el-input-number
            v-model="recordForm.hours"
            :min="0.5"
            :max="12"
            :step="0.5"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="学生人数" prop="studentCount">
          <el-input-number
            v-model="recordForm.studentCount"
            :min="1"
            :max="50"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="recordForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <!-- 收入预览 -->
        <el-divider>收入预览</el-divider>
        
        <div class="income-preview">
          <div class="preview-item">
            <span class="preview-label">
              基础课时费
              <el-tooltip content="基础课时费为100元/小时" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <span class="preview-value">100元/小时</span>
          </div>
          
          <div class="preview-item">
            <span class="preview-label">
              人数加成
              <el-tooltip content="每多一个学生加5元" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <span class="preview-value">{{ studentBonus }}元</span>
          </div>
          
          <div class="preview-item">
            <span class="preview-label">
              课程类型系数
              <el-tooltip :content="courseTypeTooltip" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <span class="preview-value">{{ selectedCourseTypeCoefficient }}</span>
          </div>
          
          <div class="preview-item total">
            <span class="preview-label">预计收入</span>
            <span class="preview-value">{{ calculatedIncome }}元</span>
          </div>
        </div>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRecord" :loading="submitting">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useWorktimeStore } from '@/store/worktime'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight, InfoFilled } from '@element-plus/icons-vue'
import { getCalendarData, createWorktimeRecord, updateWorktimeRecord, getMonthStats } from '@/api/worktime'
import { getCourseTypes } from '@/api/courseType'

const worktimeStore = useWorktimeStore()

// 日历相关数据
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 对话框相关
const dialogVisible = ref(false)
const recordFormRef = ref(null)
const submitting = ref(false)
const isEdit = ref(false)

// 记录表单
const recordForm = reactive({
  id: '',
  date: '',
  courseTypeId: '',
  hours: 2,
  studentCount: 1,
  remark: '',
  income: 0
})

// 表单验证规则
const recordRules = {
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ],
  courseTypeId: [
    { required: true, message: '请选择课程类型', trigger: 'change' }
  ],
  hours: [
    { required: true, message: '请输入工时', trigger: 'blur' }
  ],
  studentCount: [
    { required: true, message: '请输入学生人数', trigger: 'blur' }
  ]
}

// 当前年月显示
const currentYearMonth = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

// 课程类型分组
const courseTypeGroups = computed(() => {
  const groups = {}
  
  worktimeStore.courseTypes.forEach(type => {
    if (!groups[type.group]) {
      groups[type.group] = {
        label: type.group,
        options: []
      }
    }
    
    groups[type.group].options.push(type)
  })
  
  return Object.values(groups)
})

// 计算日历天数
const calendarDays = computed(() => {
  const days = []
  const year = currentYear.value
  const month = currentMonth.value
  
  // 当月第一天
  const firstDay = new Date(year, month, 1)
  // 当月最后一天
  const lastDay = new Date(year, month + 1, 0)
  
  // 当月第一天是星期几
  const firstDayOfWeek = firstDay.getDay()
  
  // 填充上个月的日期
  if (firstDayOfWeek > 0) {
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const date = new Date(year, month - 1, day)
      const dateStr = formatDate(date)
      const record = worktimeStore.getRecordByDate(dateStr)
      
      days.push({
        date,
        day,
        currentMonth: false,
        hasRecord: !!record,
        record
      })
    }
  }
  
  // 填充当月的日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const dateStr = formatDate(date)
    const record = worktimeStore.getRecordByDate(dateStr)
    
    days.push({
      date,
      day,
      currentMonth: true,
      hasRecord: !!record,
      record
    })
  }
  
  // 填充下个月的日期
  const remainingDays = 42 - days.length // 6行7列
  
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    const dateStr = formatDate(date)
    const record = worktimeStore.getRecordByDate(dateStr)
    
    days.push({
      date,
      day,
      currentMonth: false,
      hasRecord: !!record,
      record
    })
  }
  
  return days
})

// 本月汇总数据
const monthSummary = reactive({
  totalHours: 0,
  totalIncome: 0,
  averageRate: 0,
  recordDays: 0
})

// 学生人数加成
const studentBonus = computed(() => {
  return Math.max(0, recordForm.studentCount - 1) * 5
})

// 选中的课程类型系数
const selectedCourseTypeCoefficient = computed(() => {
  if (!recordForm.courseTypeId) return 1.0
  
  const courseType = worktimeStore.courseTypes.find(type => type.id === recordForm.courseTypeId)
  return courseType ? courseType.coefficient : 1.0
})

// 课程类型提示
const courseTypeTooltip = computed(() => {
  const coefficients = worktimeStore.courseTypes.map(type => `${type.name}: ${type.coefficient}`)
  return coefficients.join('\n')
})

// 计算收入
const calculatedIncome = computed(() => {
  const baseRate = 100 // 基础课时费
  const coefficient = selectedCourseTypeCoefficient.value
  const bonus = studentBonus.value
  
  return Math.round(baseRate * recordForm.hours * coefficient + bonus)
})

// 获取日历数据
const fetchCalendarData = async () => {
  try {
    const year = currentYear.value
    const month = currentMonth.value + 1
    const response = await getCalendarData(year, month)
    
    // 处理日历数据，更新calendarDays
    // 这里需要根据后端返回的数据结构进行适配
    // 暂时保留原有逻辑，等后端API实现后再调整
  } catch (error) {
    console.error('获取日历数据失败:', error)
    ElMessage.error('获取日历数据失败')
  }
}

// 获取课程类型
const fetchCourseTypes = async () => {
  try {
    const response = await getCourseTypes()
    
    // 处理课程类型数据，按组分类
    const groups = {}
    
    response.forEach(type => {
      if (!groups[type.groupName]) {
        groups[type.groupName] = {
          label: type.groupName,
          options: []
        }
      }
      
      groups[type.groupName].options.push({
        id: type.id,
        name: type.name,
        coefficient: type.coefficient
      })
    })
    
    // 更新课程类型分组
    // 暂时保留原有逻辑，等后端API实现后再调整
  } catch (error) {
    console.error('获取课程类型失败:', error)
    ElMessage.error('获取课程类型失败')
  }
}

// 上个月
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  
  fetchCalendarData()
  fetchMonthSummary()
}

// 下个月
const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  
  fetchCalendarData()
  fetchMonthSummary()
}

// 判断是否是今天
const isToday = (date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// 判断是否是过去的日期
const isPast = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

// 格式化日期
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// 打开添加对话框
const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 为特定日期添加记录
const addRecordForDate = (date) => {
  isEdit.value = false
  resetForm()
  recordForm.date = formatDate(date)
  dialogVisible.value = true
}

// 编辑记录
const editRecord = (record) => {
  isEdit.value = true
  resetForm()
  
  // 复制记录数据到表单
  Object.keys(recordForm).forEach(key => {
    if (key in record) {
      recordForm[key] = record[key]
    }
  })
  
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  recordForm.id = ''
  recordForm.date = formatDate(new Date())
  recordForm.courseTypeId = ''
  recordForm.hours = 2
  recordForm.studentCount = 1
  recordForm.remark = ''
  recordForm.income = 0
  
  if (recordFormRef.value) {
    recordFormRef.value.resetFields()
  }
}

// 提交记录
const submitRecord = () => {
  recordFormRef.value.validate(valid => {
    if (!valid) return
    
    submitting.value = true
    
    // 检查是否已存在该日期的记录
    const existingRecord = worktimeStore.getRecordByDate(recordForm.date)
    
    if (existingRecord && !isEdit.value) {
      // 如果是新增且已存在记录，提示确认覆盖
      ElMessageBox.confirm(
        '该日期已存在工时记录，是否覆盖？',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 用户确认覆盖
        saveRecord()
      }).catch(() => {
        submitting.value = false
      })
    } else {
      // 直接保存
      saveRecord()
    }
  })
}

// 保存记录
const saveRecord = async () => {
  try {
    // 设置收入
    recordForm.income = Number(calculatedIncome.value)
    
    if (isEdit.value) {
      // 更新记录
      await updateWorktimeRecord(recordForm.id, { ...recordForm })
      ElMessage.success('工时记录更新成功')
    } else {
      // 添加记录
      await createWorktimeRecord({ ...recordForm })
      ElMessage.success('工时记录添加成功')
    }
    
    dialogVisible.value = false
    fetchCalendarData()
    fetchMonthSummary()
  } catch (error) {
    console.error('保存记录失败:', error)
    ElMessage.error('操作失败：' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 获取本月汇总数据
const fetchMonthSummary = async () => {
  try {
    const year = currentYear.value
    const month = currentMonth.value + 1
    const response = await getMonthStats(year, month)
    
    monthSummary.totalHours = response.totalHours
    monthSummary.totalIncome = response.totalIncome
    monthSummary.averageRate = response.averageRate
    monthSummary.recordDays = response.recordDays
  } catch (error) {
    console.error('获取月度统计数据失败:', error)
    ElMessage.error('获取月度统计数据失败')
    
    // 重置汇总数据
    monthSummary.totalHours = 0
    monthSummary.totalIncome = 0
    monthSummary.averageRate = 0
    monthSummary.recordDays = 0
  }
}

// 组件挂载后初始化
onMounted(() => {
  fetchCourseTypes()
  fetchCalendarData()
  fetchMonthSummary()
})
</script>

<style scoped>
.worktime-container {
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

.calendar-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  padding: 20px;
}

.calendar-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.current-month {
  margin-left: 20px;
  font-size: 18px;
  font-weight: 500;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.weekday-header {
  text-align: center;
  padding: 10px;
  font-weight: bold;
  color: #606266;
}

.day-cell {
  height: 100px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 5px;
  position: relative;
  overflow: hidden;
}

.day-number {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 14px;
  color: #606266;
}

.other-month {
  background-color: #f5f7fa;
  color: #c0c4cc;
}

.today {
  border: 2px solid #409EFF;
}

.has-record {
  background-color: #f0f9eb;
}

.record-info {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 50px;
}

.income {
  margin: 5px 0;
  color: #67c23a;
  font-weight: bold;
  font-size: 14px;
}

.no-record {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.summary-card {
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
  padding: 10px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.summary-unit {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.income-preview {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.preview-label {
  display: flex;
  align-items: center;
  color: #606266;
}

.preview-label .el-icon {
  margin-left: 5px;
  color: #909399;
  cursor: help;
}

.preview-value {
  font-weight: 500;
  color: #303133;
}

.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
}

.total .preview-label {
  font-weight: bold;
  color: #303133;
}

.total .preview-value {
  font-size: 18px;
  font-weight: bold;
  color: #67c23a;
}
</style> 