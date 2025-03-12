<template>
  <div class="history-container">
    <div class="page-header">
      <h2 class="page-title">历史记录</h2>
      <el-button type="primary" @click="exportToExcel">
        <el-icon><Download /></el-icon>
        导出Excel
      </el-button>
    </div>
    
    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY年MM月DD日"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="课程类型">
          <el-select v-model="searchForm.courseTypeId" placeholder="全部" clearable>
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
        
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="备注关键词"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="pagedRecords"
        style="width: 100%"
        border
        stripe
        :header-cell-style="{ background: '#f5f7fa' }"
        v-loading="loading"
      >
        <el-table-column prop="date" label="日期" width="120" sortable>
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="courseTypeName" label="课程类型" width="150" sortable />
        
        <el-table-column prop="hours" label="工时(小时)" width="120" sortable>
          <template #default="{ row }">
            {{ row.hours }} 小时
          </template>
        </el-table-column>
        
        <el-table-column prop="studentCount" label="学生人数" width="120" sortable>
          <template #default="{ row }">
            {{ row.studentCount }} 人
          </template>
        </el-table-column>
        
        <el-table-column prop="income" label="收入(元)" width="120" sortable>
          <template #default="{ row }">
            {{ row.income }} 元
          </template>
        </el-table-column>
        
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editRecord(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteRecord(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredRecords.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          @update:current-page="currentPage = $event"
          @update:page-size="pageSize = $event"
        />
      </div>
    </el-card>
    
    <!-- 工时录入对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑工时记录"
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
            disabled
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
import { Search, Refresh, Download, InfoFilled } from '@element-plus/icons-vue'

const worktimeStore = useWorktimeStore()

// 加载状态
const loading = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框相关
const dialogVisible = ref(false)
const recordFormRef = ref(null)
const submitting = ref(false)

// 搜索表单
const searchForm = reactive({
  dateRange: [],
  courseTypeId: '',
  keyword: ''
})

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
  
  return (baseRate * recordForm.hours * coefficient + bonus).toFixed(0)
})

// 过滤后的记录
const filteredRecords = computed(() => {
  let records = [...worktimeStore.worktimeRecords]
  
  // 添加课程类型名称
  records = records.map(record => {
    const courseType = worktimeStore.courseTypes.find(type => type.id === record.courseTypeId)
    return {
      ...record,
      courseTypeName: courseType ? courseType.name : '未知'
    }
  })
  
  // 按日期范围筛选
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const startDate = searchForm.dateRange[0]
    const endDate = searchForm.dateRange[1]
    
    records = records.filter(record => {
      return record.date >= startDate && record.date <= endDate
    })
  }
  
  // 按课程类型筛选
  if (searchForm.courseTypeId) {
    records = records.filter(record => record.courseTypeId === searchForm.courseTypeId)
  }
  
  // 按关键词筛选
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    records = records.filter(record => {
      return (
        (record.remark && record.remark.toLowerCase().includes(keyword)) ||
        (record.courseTypeName && record.courseTypeName.toLowerCase().includes(keyword))
      )
    })
  }
  
  // 按日期降序排序
  records.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  return records
})

// 分页后的记录
const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return filteredRecords.value.slice(start, end)
})

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置搜索
const resetSearch = () => {
  searchForm.dateRange = []
  searchForm.courseTypeId = ''
  searchForm.keyword = ''
  currentPage.value = 1
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 编辑记录
const editRecord = (record) => {
  // 复制记录数据到表单
  Object.keys(recordForm).forEach(key => {
    if (key in record) {
      recordForm[key] = record[key]
    }
  })
  
  dialogVisible.value = true
}

// 删除记录
const deleteRecord = (record) => {
  ElMessageBox.confirm(
    '确定要删除这条工时记录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    worktimeStore.deleteWorktimeRecord(record.id)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 提交记录
const submitRecord = () => {
  recordFormRef.value.validate(valid => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      // 设置收入
      recordForm.income = Number(calculatedIncome.value)
      
      // 更新记录
      worktimeStore.updateWorktimeRecord({ ...recordForm })
      ElMessage.success('工时记录更新成功')
      
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error('操作失败：' + error.message)
    } finally {
      submitting.value = false
    }
  })
}

// 导出Excel
const exportToExcel = () => {
  ElMessage.success('Excel导出功能将在后续版本中实现')
}

// 组件挂载后初始化
onMounted(() => {
  loading.value = true
  
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<style scoped>
.history-container {
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

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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