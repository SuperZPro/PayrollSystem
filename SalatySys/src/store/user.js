import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout, getUserInfo as apiGetUserInfo } from '@/api/auth'
import router from '@/router'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || {
      name: '',
      avatar: '',
      role: '',
      employeeId: '',
      department: '',
      position: ''
    }
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    
    // 登录
    async login(loginForm) {
      try {
        const response = await apiLogin(loginForm)
        this.setToken(response.token)
        this.setUserInfo(response.userInfo)
        ElMessage.success('登录成功')
        return response
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },
    
    // 登出
    async logout() {
      try {
        if (this.token) {
          await apiLogout()
        }
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.token = ''
        this.userInfo = {
          name: '',
          avatar: '',
          role: '',
          employeeId: '',
          department: '',
          position: ''
        }
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        router.push('/login')
      }
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      try {
        const userInfo = await apiGetUserInfo()
        this.setUserInfo(userInfo)
        return userInfo
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    }
  }
}) 