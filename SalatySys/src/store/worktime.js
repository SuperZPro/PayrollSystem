import { defineStore } from 'pinia'

export const useWorktimeStore = defineStore('worktime', {
  state: () => ({
    worktimeRecords: JSON.parse(localStorage.getItem('worktimeRecords')) || [],
    courseTypes: [
      { id: 1, name: '小学语文', group: '小学', coefficient: 1.0 },
      { id: 2, name: '小学数学', group: '小学', coefficient: 1.1 },
      { id: 3, name: '小学英语', group: '小学', coefficient: 1.1 },
      { id: 4, name: '初中语文', group: '初中', coefficient: 1.1 },
      { id: 5, name: '初中数学', group: '初中', coefficient: 1.2 },
      { id: 6, name: '初中英语', group: '初中', coefficient: 1.2 },
      { id: 7, name: '高中语文', group: '高中', coefficient: 1.2 },
      { id: 8, name: '高中数学', group: '高中', coefficient: 1.3 },
      { id: 9, name: '高中英语', group: '高中', coefficient: 1.3 }
    ]
  }),
  
  getters: {
    // 按月份分组的工时记录
    recordsByMonth: (state) => {
      const grouped = {}
      state.worktimeRecords.forEach(record => {
        const date = new Date(record.date)
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!grouped[yearMonth]) {
          grouped[yearMonth] = []
        }
        
        grouped[yearMonth].push(record)
      })
      
      return grouped
    },
    
    // 获取特定月份的工时记录
    getRecordsByMonth: (state) => (yearMonth) => {
      return state.worktimeRecords.filter(record => {
        const date = new Date(record.date)
        const recordYearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return recordYearMonth === yearMonth
      })
    },
    
    // 获取特定日期的工时记录
    getRecordByDate: (state) => (dateStr) => {
      return state.worktimeRecords.find(record => record.date === dateStr)
    }
  },
  
  actions: {
    // 添加工时记录
    addWorktimeRecord(record) {
      // 生成唯一ID
      record.id = Date.now().toString()
      
      // 计算收入
      const courseType = this.courseTypes.find(type => type.id === record.courseTypeId)
      const baseRate = 100 // 基础课时费
      const studentBonus = Math.max(0, record.studentCount - 1) * 5 // 每多一个学生加5元
      record.income = Math.round(baseRate * record.hours * courseType.coefficient + studentBonus)
      
      this.worktimeRecords.push(record)
      this.saveToLocalStorage()
      
      return record
    },
    
    // 更新工时记录
    updateWorktimeRecord(updatedRecord) {
      const index = this.worktimeRecords.findIndex(record => record.id === updatedRecord.id)
      
      if (index !== -1) {
        // 重新计算收入
        const courseType = this.courseTypes.find(type => type.id === updatedRecord.courseTypeId)
        const baseRate = 100 // 基础课时费
        const studentBonus = Math.max(0, updatedRecord.studentCount - 1) * 5 // 每多一个学生加5元
        updatedRecord.income = Math.round(baseRate * updatedRecord.hours * courseType.coefficient + studentBonus)
        
        this.worktimeRecords[index] = updatedRecord
        this.saveToLocalStorage()
        
        return updatedRecord
      }
      
      return null
    },
    
    // 删除工时记录
    deleteWorktimeRecord(id) {
      const index = this.worktimeRecords.findIndex(record => record.id === id)
      
      if (index !== -1) {
        this.worktimeRecords.splice(index, 1)
        this.saveToLocalStorage()
        return true
      }
      
      return false
    },
    
    // 保存到本地存储
    saveToLocalStorage() {
      localStorage.setItem('worktimeRecords', JSON.stringify(this.worktimeRecords))
    }
  }
}) 