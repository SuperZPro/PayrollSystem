<template>
  <div class="history-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">工时记录历史</h1>
      <el-button type="primary" @click="exportToExcel">
        <el-icon><Download /></el-icon>
        导出Excel
      </el-button>
    </div>
    
    <!-- 搜索卡片 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="课程类型">
          <el-select v-model="searchForm.courseTypeId" placeholder="选择课程类型" clearable>
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
            placeholder="备注或课程类型"
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
    
    <!-- 表格卡片 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="pagedRecords"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="date" label="日期" width="120" sortable>
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="courseTypeName" label="课程类型" width="150" />
        
        <el-table-column prop="hours" label="工时" width="80" align="center" />
        
        <el-table-column prop="studentCount" label="学生人数" width="100" align="center" />
        
        <el-table-column prop="income" label="收入" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.income }}
          </template>
        </el-table-column>
        
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              text
              @click="editRecord(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click="deleteRecord(row)"
            >
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
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          @update:current-page="currentPage = $event"
          @update:page-size="pageSize = $event"
        />
      </div>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑工时记录"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="recordFormRef"
        :model="recordForm"
        :rules="recordRules"
        label-width="100px"
      >
        <el-form-item label="日期">
          <el-date-picker
            v-model="recordForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            disabled
          />
        </el-form-item>
        
        <el-form-item label="课程类型" prop="courseTypeId">
          <el-select v-model="recordForm.courseTypeId" placeholder="选择课程类型">
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
            :max="24"
            :step="0.5"
            step-strictly
          />
        </el-form-item>
        
        <el-form-item label="学生人数" prop="studentCount">
          <el-input-number
            v-model="recordForm.studentCount"
            :min="1"
            :max="20"
            :step="1"
            step-strictly
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="recordForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <el-form-item label="预计收入">
          <div class="income-preview">
            <div class="preview-item">
              <span class="preview-label">基础课时费：</span>
              <span class="preview-value">¥100 × {{ recordForm.hours }} = ¥{{ 100 * recordForm.hours }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">课程系数：</span>
              <span class="preview-value">{{ selectedCourseTypeCoefficient }}
                <el-tooltip placement="top" :content="courseTypeTooltip">
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
            </div>
            <div class="preview-item">
              <span class="preview-label">学生加成：</span>
              <span class="preview-value">¥{{ studentBonus }}</span>
            </div>
            <div class="preview-item total">
              <span class="preview-label">总计：</span>
              <span class="preview-value">¥{{ calculatedIncome }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitRecord"
            :loading="submitting"
          >
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, InfoFilled } from '@element-plus/icons-vue'
import { getWorktimeRecords, updateWorktimeRecord, deleteWorktimeRecord, exportWorktimeRecords } from '@/api/worktime'
import { getCourseTypes } from '@/api/courseType'

// 加载状态
const loading = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

// 课程类型列表
const courseTypes = ref([])

// 工时记录列表
const records = ref([])

// 课程类型分组
const courseTypeGroups = computed(() => {
  const groups = {}
  
  courseTypes.value.forEach(type => {
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
  
  const courseType = courseTypes.value.find(type => type.id === recordForm.courseTypeId)
  return courseType ? courseType.coefficient : 1.0
})

// 课程类型提示
const courseTypeTooltip = computed(() => {
  const coefficients = courseTypes.value.map(type => `${type.name}: ${type.coefficient}`)
  return coefficients.join('\n')
})

// 计算收入
const calculatedIncome = computed(() => {
  const baseRate = 100 // 基础课时费
  const coefficient = selectedCourseTypeCoefficient.value
  const bonus = studentBonus.value
  
  return (baseRate * recordForm.hours * coefficient + bonus).toFixed(0)
})

// 分页后的记录
const pagedRecords = computed(() => {
  return records.value
})

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// 获取工时记录
const fetchRecords = async () => {
  loading.value = true
  
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      sortField: 'date',
      sortOrder: 'desc'
    }
    
    // 添加日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    // 添加课程类型
    if (searchForm.courseTypeId) {
      params.courseTypeId = searchForm.courseTypeId
    }
    
    // 添加关键词
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    
    const res = await getWorktimeRecords(params)
    records.value = res.data.records.map(record => {
      const courseType = courseTypes.value.find(type => type.id === record.courseTypeId)
      return {
        ...record,
        courseTypeName: courseType ? courseType.name : '未知'
      }
    })
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取工时记录失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 获取课程类型
const fetchCourseTypes = async () => {
  try {
    const res = await getCourseTypes()
    courseTypes.value = res.data
  } catch (error) {
    ElMessage.error('获取课程类型失败：' + error.message)
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchRecords()
}

// 重置搜索
const resetSearch = () => {
  searchForm.dateRange = []
  searchForm.courseTypeId = ''
  searchForm.keyword = ''
  currentPage.value = 1
  fetchRecords()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchRecords()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRecords()
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
  ).then(async () => {
    try {
      await deleteWorktimeRecord(record.id)
      ElMessage.success('删除成功')
      fetchRecords()
    } catch (error) {
      ElMessage.error('删除失败：' + error.message)
    }
  }).catch(() => {
    // 取消删除
  })
}

// 提交记录
const submitRecord = () => {
  recordFormRef.value.validate(async valid => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      // 设置收入
      recordForm.income = Number(calculatedIncome.value)
      
      // 更新记录
      await updateWorktimeRecord(recordForm.id, recordForm)
      ElMessage.success('工时记录更新成功')
      
      dialogVisible.value = false
      fetchRecords()
    } catch (error) {
      ElMessage.error('操作失败：' + error.message)
    } finally {
      submitting.value = false
    }
  })
}

// 导出Excel
const exportToExcel = async () => {
  try {
    // 构建API请求参数
    const params = {
      sortField: 'date',
      sortOrder: 'desc'
    }
    
    // 添加日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    // 添加课程类型
    if (searchForm.courseTypeId) {
      params.courseTypeId = searchForm.courseTypeId
    }
    
    // 添加关键词
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    
    // 调用API导出Excel
    const blob = await exportWorktimeRecords(params)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    
    // 设置文件名
    const filename = `工时记录_${new Date().toISOString().split('T')[0]}.xlsx`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('Excel导出成功')
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error('导出Excel失败：' + (error.response?.data?.message || error.message || '未知错误'))
  }
}

// 组件挂载后初始化
onMounted(async () => {
  await fetchCourseTypes()
  fetchRecords()
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
  margin-bottom: 8px;
}

.preview-item.total {
  margin-top: 10px;
  font-weight: bold;
  border-top: 1px solid #dcdfe6;
  padding-top: 10px;
}

.info-icon {
  margin-left: 5px;
  color: #909399;
  cursor: pointer;
}
</style> 