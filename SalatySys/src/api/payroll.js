import request from './request'

/**
 * 获取工资单列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getPayrolls(params) {
  return request({
    url: '/payrolls',
    method: 'get',
    params
  })
}

/**
 * 获取特定工资单
 * @param {number} id - 工资单ID
 * @returns {Promise}
 */
export function getPayrollById(id) {
  return request({
    url: `/payrolls/${id}`,
    method: 'get'
  })
}

/**
 * 生成工资单
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {Promise}
 */
export function generatePayroll(year, month) {
  return request({
    url: `/payrolls/generate/${year}/${month}`,
    method: 'post'
  })
}

/**
 * 导出工资单
 * @param {number} id - 工资单ID
 * @returns {Promise}
 */
export function exportPayroll(id) {
  return request({
    url: `/payrolls/export/${id}`,
    method: 'get',
    responseType: 'blob'
  })
} 