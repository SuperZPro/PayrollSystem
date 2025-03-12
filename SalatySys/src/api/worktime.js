import request from './request'

/**
 * 获取工时记录列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @param {number} params.courseTypeId - 课程类型ID
 * @param {string} params.keyword - 关键词
 * @param {string} params.sortField - 排序字段
 * @param {string} params.sortOrder - 排序方式
 * @returns {Promise}
 */
export function getWorktimeRecords(params) {
  return request({
    url: '/worktime-records',
    method: 'get',
    params
  })
}

/**
 * 获取特定工时记录
 * @param {number} id - 工时记录ID
 * @returns {Promise}
 */
export function getWorktimeRecord(id) {
  return request({
    url: `/worktime-records/${id}`,
    method: 'get'
  })
}

/**
 * 创建工时记录
 * @param {Object} data - 工时记录数据
 * @returns {Promise}
 */
export function createWorktimeRecord(data) {
  return request({
    url: '/worktime-records',
    method: 'post',
    data
  })
}

/**
 * 更新工时记录
 * @param {number} id - 工时记录ID
 * @param {Object} data - 工时记录数据
 * @returns {Promise}
 */
export function updateWorktimeRecord(id, data) {
  return request({
    url: `/worktime-records/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除工时记录
 * @param {number} id - 工时记录ID
 * @returns {Promise}
 */
export function deleteWorktimeRecord(id) {
  return request({
    url: `/worktime-records/${id}`,
    method: 'delete'
  })
}

/**
 * 获取月历视图数据
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {Promise}
 */
export function getCalendarData(year, month) {
  return request({
    url: `/worktime-records/calendar/${year}/${month}`,
    method: 'get'
  })
}

/**
 * 获取月度统计数据
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {Promise}
 */
export function getMonthStats(year, month) {
  return request({
    url: `/worktime-records/stats/${year}/${month}`,
    method: 'get'
  })
}

/**
 * 导出工时记录Excel
 * @param {Object} params - 查询参数
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @param {number} params.courseTypeId - 课程类型ID
 * @param {string} params.keyword - 关键词
 * @param {string} params.sortField - 排序字段
 * @param {string} params.sortOrder - 排序方式
 * @returns {Promise}
 */
export function exportWorktimeRecords(params) {
  return request({
    url: '/worktime-records/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
} 