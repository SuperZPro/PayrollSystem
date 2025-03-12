<template>
  <div class="dashboard-container">
    <!-- 欢迎信息 -->
    <div class="welcome-section">
      <h2 class="welcome-title">
        欢迎回来，{{ userInfo.name || '用户' }}
        <el-tag size="small" type="success" class="ml-2">{{ currentDate }}</el-tag>
      </h2>
    </div>
    
    <!-- 数据卡片 -->
    <el-row :gutter="20" class="data-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span>本月总工时</span>
            <el-icon class="card-icon"><Timer /></el-icon>
          </div>
          <div class="card-value">{{ monthlyStats.totalHours || 0 }}</div>
          <div class="card-unit">小时</div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span>本月总收入</span>
            <el-icon class="card-icon"><Money /></el-icon>
          </div>
          <div class="card-value">{{ monthlyStats.totalIncome || 0 }}</div>
          <div class="card-unit">元</div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span>平均课时费</span>
            <el-icon class="card-icon"><Coin /></el-icon>
          </div>
          <div class="card-value">{{ monthlyStats.averageRate || 0 }}</div>
          <div class="card-unit">元/时</div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span>工作天数</span>
            <el-icon class="card-icon"><Calendar /></el-icon>
          </div>
          <div class="card-value">{{ monthlyStats.workDays || 0 }}</div>
          <div class="card-unit">天</div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>收入趋势</span>
              <el-radio-group v-model="incomeChartPeriod" size="small">
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
                <el-radio-button label="year">年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="incomeChartRef"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>课程类型分布</span>
            </div>
          </template>
          <div class="chart-container" ref="courseTypeChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-section">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>工作日/周末对比</span>
            </div>
          </template>
          <div class="chart-container" ref="weekdayChartRef"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>最近工作记录</span>
              <el-button type="primary" size="small" @click="goToWorktime">
                录入工时
              </el-button>
            </div>
          </template>
          <el-table :data="recentRecords" style="width: 100%" :max-height="300">
            <el-table-column prop="date" label="日期" width="100" />
            <el-table-column prop="courseTypeName" label="课程类型" width="120" />
            <el-table-column prop="hours" label="工时(小时)" width="100" />
            <el-table-column prop="income" label="收入(元)" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useWorktimeStore } from '@/store/worktime'
import { Timer, Money, Coin, Calendar } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { 
  TitleComponent, 
  TooltipComponent, 
  GridComponent, 
  LegendComponent 
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

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

const router = useRouter()
const userStore = useUserStore()
const worktimeStore = useWorktimeStore()

// 图表引用
const incomeChartRef = ref(null)
const courseTypeChartRef = ref(null)
const weekdayChartRef = ref(null)

// 图表实例
let incomeChart = null
let courseTypeChart = null
let weekdayChart = null

// 收入图表周期
const incomeChartPeriod = ref('month')

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

// 本月统计数据
const monthlyStats = reactive({
  totalHours: 0,
  totalIncome: 0,
  averageRate: 0,
  workDays: 0
})

// 最近工作记录
const recentRecords = ref([])

// 初始化收入趋势图表
const initIncomeChart = () => {
  if (incomeChart) {
    incomeChart.dispose()
  }
  
  incomeChart = echarts.init(incomeChartRef.value)
  
  // 模拟数据
  const dates = []
  const incomeData = []
  const hoursData = []
  
  // 生成过去30天的数据
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
    
    // 模拟收入和工时数据
    const income = Math.floor(Math.random() * 500) + 100
    const hours = Math.floor(Math.random() * 5) + 1
    
    incomeData.push(income)
    hoursData.push(hours)
  }
  
  const option = {
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
        data: dates
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
        position: 'right',
        max: 12
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
        data: incomeData
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
        data: hoursData
      }
    ]
  }
  
  incomeChart.setOption(option)
}

// 初始化课程类型分布图表
const initCourseTypeChart = () => {
  if (courseTypeChart) {
    courseTypeChart.dispose()
  }
  
  courseTypeChart = echarts.init(courseTypeChartRef.value)
  
  // 模拟数据
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['小学语文', '小学数学', '初中语文', '初中数学', '高中数学']
    },
    series: [
      {
        name: '课程收入',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: '小学语文' },
          { value: 735, name: '小学数学' },
          { value: 580, name: '初中语文' },
          { value: 484, name: '初中数学' },
          { value: 300, name: '高中数学' }
        ]
      }
    ]
  }
  
  courseTypeChart.setOption(option)
}

// 初始化工作日/周末对比图表
const initWeekdayChart = () => {
  if (weekdayChart) {
    weekdayChart.dispose()
  }
  
  weekdayChart = echarts.init(weekdayChartRef.value)
  
  // 模拟数据
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['工作日', '周末']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['工时(小时)', '收入(元)', '平均时薪(元/时)']
    },
    series: [
      {
        name: '工作日',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [20, 2000, 100]
      },
      {
        name: '周末',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [10, 1300, 130]
      }
    ]
  }
  
  weekdayChart.setOption(option)
}

// 加载最近工作记录
const loadRecentRecords = () => {
  // 获取最近10条记录
  const records = [...worktimeStore.worktimeRecords]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
  
  // 添加课程类型名称
  recentRecords.value = records.map(record => {
    const courseType = worktimeStore.courseTypes.find(type => type.id === record.courseTypeId)
    return {
      ...record,
      courseTypeName: courseType ? courseType.name : '未知'
    }
  })
}

// 计算本月统计数据
const calculateMonthlyStats = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  
  // 获取本月记录
  const monthRecords = worktimeStore.worktimeRecords.filter(record => {
    const recordDate = new Date(record.date)
    return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth
  })
  
  // 计算统计数据
  if (monthRecords.length > 0) {
    const totalHours = monthRecords.reduce((sum, record) => sum + record.hours, 0)
    const totalIncome = monthRecords.reduce((sum, record) => sum + record.income, 0)
    
    // 计算工作天数（按日期去重）
    const workDaysSet = new Set(monthRecords.map(record => record.date))
    
    monthlyStats.totalHours = totalHours.toFixed(1)
    monthlyStats.totalIncome = totalIncome.toFixed(0)
    monthlyStats.averageRate = totalHours > 0 ? (totalIncome / totalHours).toFixed(0) : 0
    monthlyStats.workDays = workDaysSet.size
  }
}

// 跳转到工时录入页面
const goToWorktime = () => {
  router.push('/worktime')
}

// 窗口大小变化时重新调整图表大小
const handleResize = () => {
  incomeChart && incomeChart.resize()
  courseTypeChart && courseTypeChart.resize()
  weekdayChart && weekdayChart.resize()
}

// 组件挂载后初始化
onMounted(() => {
  // 加载数据
  loadRecentRecords()
  calculateMonthlyStats()
  
  // 初始化图表
  nextTick(() => {
    initIncomeChart()
    initCourseTypeChart()
    initWeekdayChart()
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  })
})

// 组件卸载前清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  incomeChart && incomeChart.dispose()
  courseTypeChart && courseTypeChart.dispose()
  weekdayChart && weekdayChart.dispose()
})

// 监听收入图表周期变化
watch(incomeChartPeriod, () => {
  initIncomeChart()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.welcome-section {
  margin-bottom: 20px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.ml-2 {
  margin-left: 8px;
}

.data-cards {
  margin-bottom: 20px;
}

.data-card {
  height: 120px;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 16px;
  color: #606266;
}

.card-icon {
  font-size: 20px;
  color: #409EFF;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.card-unit {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}
</style> 