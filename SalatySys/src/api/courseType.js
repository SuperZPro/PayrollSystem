import request from './request'

/**
 * 获取所有课程类型
 * @returns {Promise}
 */
export function getCourseTypes() {
  return request({
    url: '/course-types',
    method: 'get'
  })
}

/**
 * 获取特定课程类型
 * @param {number} id - 课程类型ID
 * @returns {Promise}
 */
export function getCourseType(id) {
  return request({
    url: `/course-types/${id}`,
    method: 'get'
  })
}

/**
 * 创建课程类型（管理员）
 * @param {Object} data - 课程类型数据
 * @returns {Promise}
 */
export function createCourseType(data) {
  return request({
    url: '/course-types',
    method: 'post',
    data
  })
}

/**
 * 更新课程类型（管理员）
 * @param {number} id - 课程类型ID
 * @param {Object} data - 课程类型数据
 * @returns {Promise}
 */
export function updateCourseType(id, data) {
  return request({
    url: `/course-types/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除课程类型（管理员）
 * @param {number} id - 课程类型ID
 * @returns {Promise}
 */
export function deleteCourseType(id) {
  return request({
    url: `/course-types/${id}`,
    method: 'delete'
  })
} 