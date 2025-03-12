<template>
  <div class="report-container">
    <div class="page-header">
      <h2 class="page-title">收入报表</h2>
      <el-button type="primary" @click="exportReport">
        <el-icon><Download /></el-icon>
        导出报表
      </el-button>
    </div>
    
    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="报表类型">
          <el-radio-group v-model="filterForm.reportType">
            <el-radio-button label="month">月度</el-radio-button>
            <el-radio-button label="quarter">季度</el-radio-button>
            <el-radio-button label="year">年度</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            :type="datePickerType"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :format="dateFormat"
            :value-format="valueFormat"
          />
        </el-form-item>
        
        <el-form-item label="课程类型">
          <el-select v-model="filterForm.courseTypeId" placeholder="全部" clearable>
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
        
        <el-form-item>
          <el-button type="primary" @click="generateReport" :loading="loading">
            <el-icon><DataAnalysis /></el-icon>
            生成报表
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 报表内容 -->
    <div v-if="hasReportData" class="report-content">
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="report-tabs">
        <el-tab-pane label="收入趋势" name="trend">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-container" ref="trendChartRef"></div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="课程类型分布" name="distribution">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-container" ref="distributionChartRef"></div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="工作日/周末对比" name="weekday">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-container" ref="weekdayChartRef"></div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="数据明细" name="detail">
          <el-card shadow="hover" class="detail-card">
            <el-table
              :data="reportData.details"
              style="width: 100%"
              border
              stripe
              :summary-method="getSummary"
              show-summary
            >
              <el-table-column prop="period" label="时间段" width="150" />
              <el-table-column prop="hours" label="工时(小时)" width="120" />
              <el-table-column prop="income" label="收入(元)" width="120" />
              <el-table-column prop="studentCount" label="学生人次" width="120" />
              <el-table-column prop="averageRate" label="平均时薪(元/时)" width="150" />
              <el-table-column prop="workDays" label="工作天数" width="120" />
            </el-table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 报表摘要 -->
      <el-card class="summary-card">
        <template #header>
          <div class="card-header">
            <span>报表摘要</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="4">
            <div class="summary-item">
              <div class="summary-label">总工时</div>
              <div class="summary-value">{{ reportData.summary.totalHours || 0 }}</div>
              <div class="summary-unit">小时</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-item">
              <div class="summary-label">总收入</div>
              <div class="summary-value">{{ reportData.summary.totalIncome || 0 }}</div>
              <div class="summary-unit">元</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-item">
              <div class="summary-label">平均时薪</div>
              <div class="summary-value">{{ reportData.summary.averageRate || 0 }}</div>
              <div class="summary-unit">元/时</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-item">
              <div class="summary-label">工作天数</div>
              <div class="summary-value">{{ reportData.summary.workDays || 0 }}</div>
              <div class="summary-unit">天</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-item">
              <div class="summary-label">学生总人次</div>
              <div class="summary-value">{{ reportData.summary.totalStudentCount || 0 }}</div>
              <div class="summary-unit">人次</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-item">
              <div class="summary-label">最高单日收入</div>
              <div class="summary-value">{{ reportData.summary.maxDailyIncome || 0 }}</div>
              <div class="summary-unit">元</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
    
    <!-- 无数据提示 -->
    <el-empty v-else description="暂无报表数据，请选择时间范围生成报表" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useWorktimeStore } from '@/store/worktime'
import { ElMessage } from 'element-plus'
import { Download, DataAnalysis, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { 
  TitleComponent, 
  TooltipComponent, 
  GridComponent, 
  LegendComponent 
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getIncomeReport, exportReport } from '@/api/report'

// 注册必要的组件
echarts.use([
  TitleComponent, 
  TooltipComponent, 
  GridComponent, 
  LegendComponent,
  LineChart,
  PieChart,
  BarChart,
  CanvasRenderer
])

const worktimeStore = useWorktimeStore()

// 图表引用
const trendChartRef = ref(null)
const distributionChartRef = ref(null)
const weekdayChartRef = ref(null)

// 图表实例
let trendChart = null
let distributionChart = null
let weekdayChart = null

// 加载状态
const loading = ref(false)

// 当前标签页
const activeTab = ref('trend')

// 筛选表单
const filterForm = reactive({
  reportType: 'month',
  dateRange: [],
  courseTypeId: ''
})

// 报表数据
const reportData = reactive({
  summary: {
    totalHours: 0,
    totalIncome: 0,
    averageRate: 0,
    workDays: 0,
    totalStudentCount: 0,
    maxDailyIncome: 0
  },
  details: [],
  trendData: {
    dates: [],
    hours: [],
    incomes: []
  },
  distributionData: [],
  weekdayData: {
    weekday: { hours: 0, income: 0, averageRate: 0 },
    weekend: { hours: 0, income: 0, averageRate: 0 }
  }
})

// 是否有报表数据
const hasReportData = computed(() => {
  return reportData.details.length > 0
})

// 日期选择器类型
const datePickerType = computed(() => {
  switch (filterForm.reportType) {
    case 'month':
      return 'monthrange'
    case 'quarter':
      return 'monthrange'
    case 'year':
      return 'yearrange'
    default:
      return 'daterange'
  }
})

// 日期格式
const dateFormat = computed(() => {
  switch (filterForm.reportType) {
    case 'month':
      return 'YYYY年MM月'
    case 'quarter':
      return 'YYYY年MM月'
    case 'year':
      return 'YYYY年'
    default:
      return 'YYYY年MM月DD日'
  }
})

// 值格式
const valueFormat = computed(() => {
  switch (filterForm.reportType) {
    case 'month':
      return 'YYYY-MM'
    case 'quarter':
      return 'YYYY-MM'
    case 'year':
      return 'YYYY'
    default:
      return 'YYYY-MM-DD'
  }
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

// 获取表格汇总行
const getSummary = (param) => {
  const { columns, data } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    const values = data.map(item => Number(item[column.property]) || 0)
    
    if (column.property === 'period') {
      sums[index] = ''
    } else if (column.property === 'averageRate') {
      const totalHours = data.reduce((sum, item) => sum + (Number(item.hours) || 0), 0)
      const totalIncome = data.reduce((sum, item) => sum + (Number(item.income) || 0), 0)
      sums[index] = totalHours > 0 ? (totalIncome / totalHours).toFixed(0) : 0
    } else {
      sums[index] = values.reduce((prev, curr) => {
        return prev + curr
      }, 0)
    }
  })
  
  return sums
}

// 重置筛选条件
const resetFilter = () => {
  filterForm.dateRange = []
  filterForm.courseTypeId = ''
}

// 生成报表
const generateReport = async () => {
  if (!filterForm.dateRange || filterForm.dateRange.length !== 2) {
    ElMessage.warning('请选择时间范围')
    return
  }
  
  loading.value = true
  
  try {
    // 构建API请求参数
    const params = {
      startDate: filterForm.dateRange[0],
      endDate: filterForm.dateRange[1],
      reportType: filterForm.reportType,
      courseTypeId: filterForm.courseTypeId || undefined
    }
    
    // 调用API获取报表数据
    const data = await getIncomeReport(params)
    
    // 更新报表数据
    reportData.summary = data.summary
    reportData.details = data.details
    
    // 更新趋势数据
    reportData.trendData.dates = data.trendData.dates
    reportData.trendData.hours = data.trendData.hours
    reportData.trendData.incomes = data.trendData.incomes
    
    // 更新分布数据
    reportData.distributionData = data.distributionData
    
    // 更新工作日/周末数据
    reportData.weekdayData = data.weekdayData
    
    // 初始化图表
    initCharts()
    
    ElMessage.success('报表生成成功')
  } catch (error) {
    console.error('获取报表数据失败:', error)
    ElMessage.error('报表生成失败：' + (error.response?.data?.message || error.message || '未知错误'))
    
    // 如果是开发环境，使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      generateMockReportData()
      initCharts()
      ElMessage.info('使用模拟数据进行展示')
    }
  } finally {
    loading.value = false
  }
}

// 导出报表
const exportReport = async () => {
  if (!hasReportData.value) {
    ElMessage.warning('请先生成报表')
    return
  }
  
  try {
    // 构建API请求参数
    const params = {
      startDate: filterForm.dateRange[0],
      endDate: filterForm.dateRange[1],
      reportType: filterForm.reportType,
      courseTypeId: filterForm.courseTypeId || undefined,
      exportType: 'excel'
    }
    
    // 调用导出API
    const blob = await exportReport(params)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    
    // 设置文件名
    const filename = `收入报表_${filterForm.dateRange[0]}_${filterForm.dateRange[1]}.xlsx`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('报表导出成功')
  } catch (error) {
    console.error('导出报表失败:', error)
    ElMessage.error('报表导出失败：' + (error.response?.data?.message || error.message || '未知错误'))
  }
}

// 生成模拟报表数据 (仅用于开发环境)
const generateMockReportData = () => {
  // 模拟明细数据
  reportData.details = [
    { period: '2023年1月', hours: 45, income: 5000, studentCount: 30, averageRate: 111, workDays: 15 },
    { period: '2023年2月', hours: 50, income: 5500, studentCount: 35, averageRate: 110, workDays: 16 },
    { period: '2023年3月', hours: 55, income: 6000, studentCount: 40, averageRate: 109, workDays: 18 }
  ]
  
  // 模拟汇总数据
  reportData.summary = {
    totalHours: 150,
    totalIncome: 16500,
    averageRate: 110,
    workDays: 49,
    totalStudentCount: 105,
    maxDailyIncome: 500
  }
  
  // 模拟趋势数据
  reportData.trendData = {
    dates: ['2023-01', '2023-02', '2023-03'],
    hours: [45, 50, 55],
    incomes: [5000, 5500, 6000]
  }
  
  // 模拟分布数据
  reportData.distributionData = [
    { value: 5000, name: '小学语文' },
    { value: 4000, name: '小学数学' },
    { value: 3000, name: '初中语文' },
    { value: 2500, name: '初中数学' },
    { value: 2000, name: '高中数学' }
  ]
  
  // 模拟工作日/周末数据
  reportData.weekdayData = {
    weekday: { hours: 120, income: 13000, averageRate: 108 },
    weekend: { hours: 30, income: 3500, averageRate: 117 }
  }
}

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    initTrendChart()
    initDistributionChart()
    initWeekdayChart()
  })
}

// 初始化趋势图表
const initTrendChart = () => {
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  
  const option = {
    title: {
      text: '收入和工时趋势'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['收入(元)', '工时(小时)']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: reportData.trendData.dates
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '收入(元)',
        position: 'left'
      },
      {
        type: 'value',
        name: '工时(小时)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '收入(元)',
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        emphasis: {
          focus: 'series'
        },
        data: reportData.trendData.incomes
      },
      {
        name: '工时(小时)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        emphasis: {
          focus: 'series'
        },
        data: reportData.trendData.hours
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 初始化分布图表
const initDistributionChart = () => {
  if (distributionChart) {
    distributionChart.dispose()
  }
  
  distributionChart = echarts.init(distributionChartRef.value)
  
  const option = {
    title: {
      text: '课程类型收入分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: reportData.distributionData.map(item => item.name)
    },
    series: [
      {
        name: '收入分布',
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        data: reportData.distributionData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  distributionChart.setOption(option)
}

// 初始化工作日/周末图表
const initWeekdayChart = () => {
  if (weekdayChart) {
    weekdayChart.dispose()
  }
  
  weekdayChart = echarts.init(weekdayChartRef.value)
  
  const option = {
    title: {
      text: '工作日/周末收入对比'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['工时(小时)', '收入(元)', '平均时薪(元/时)']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['工作日', '周末']
    },
    yAxis: [
      {
        type: 'value',
        name: '工时/收入',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '平均时薪',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '工时(小时)',
        type: 'bar',
        data: [
          reportData.weekdayData.weekday.hours,
          reportData.weekdayData.weekend.hours
        ]
      },
      {
        name: '收入(元)',
        type: 'bar',
        data: [
          reportData.weekdayData.weekday.income,
          reportData.weekdayData.weekend.income
        ]
      },
      {
        name: '平均时薪(元/时)',
        type: 'line',
        yAxisIndex: 1,
        data: [
          reportData.weekdayData.weekday.averageRate,
          reportData.weekdayData.weekend.averageRate
        ]
      }
    ]
  }
  
  weekdayChart.setOption(option)
}

// 监听窗口大小变化，重绘图表
const handleResize = () => {
  if (trendChart) {
    trendChart.resize()
  }
  if (distributionChart) {
    distributionChart.resize()
  }
  if (weekdayChart) {
    weekdayChart.resize()
  }
}

// 组件挂载时
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  // 加载课程类型
  if (worktimeStore.courseTypes.length === 0) {
    worktimeStore.fetchCourseTypes()
  }
})

// 组件卸载时
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
  
  if (distributionChart) {
    distributionChart.dispose()
    distributionChart = null
  }
  
  if (weekdayChart) {
    weekdayChart.dispose()
    weekdayChart = null
  }
})

// 监听标签页变化，重绘当前标签页的图表
watch(activeTab, (newValue) => {
  nextTick(() => {
    if (newValue === 'trend' && trendChart) {
      trendChart.resize()
    } else if (newValue === 'distribution' && distributionChart) {
      distributionChart.resize()
    } else if (newValue === 'weekday' && weekdayChart) {
      weekdayChart.resize()
    }
  })
})
</script>

<style scoped>
.report-container {
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

.filter-card {
  margin-bottom: 20px;
}

.report-content {
  margin-top: 20px;
}

.report-tabs {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  height: 400px;
}

.detail-card {
  margin-bottom: 20px;
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
</style> 