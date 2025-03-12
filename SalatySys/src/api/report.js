import request from './request'

/**
 * 获取收入报表
 * @param {Object} params - 查询参数
 * @param {string} params.reportType - 报表类型（month/quarter/year）
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @param {number} params.courseTypeId - 课程类型ID
 * @returns {Promise}
 */
export function getIncomeReport(params) {
  return request({
    url: '/reports/income',
    method: 'get',
    params
  })
}

/**
 * 导出报表
 * @param {Object} params - 查询参数
 * @param {string} params.reportType - 报表类型（month/quarter/year）
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @param {number} params.courseTypeId - 课程类型ID
 * @param {string} params.exportType - 导出类型（excel/pdf）
 * @returns {Promise}
 */
export function exportReport(params) {
  return request({
    url: '/reports/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
} 