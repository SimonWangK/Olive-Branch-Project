
import { request } from '@umijs/max';


// 查询用户信息列表
export async function getCaseList(params?: any,) {
  return request<API.System.UserPageResult>('/api/cases/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params,
    // ...(options || {})
  });
}
