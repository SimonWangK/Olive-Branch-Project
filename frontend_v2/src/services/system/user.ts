
import { request } from '@umijs/max';


export async function getUserList(params?: any,) {
  return request<API.System.UserPageResult>('/api/user/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params,

  });
}



export async function updateUserProfile(data: {
  name?: string;
  mobile?: string;
  email?: string;
  gender?: number;
}) {
  return request<API.Result>('/api/user/profile', {
    method: 'PUT',
    data,
  });
}


export async function addUser(data:any) {
  return request<API.Result>('/api/user/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: data
  });
}


// 
export async function removeUser(ids: number) {
  return request<API.Result>(`/api/user/${ids}`, {
    method: 'DELETE'
  });
}

export async function updateUserPassword(data: {
  oldPassword: string;
  newPassword: string;
}) {
  return request<API.Result>('/api/user/password', {
    method: 'PUT',
    data,
  });
}


export function uploadAvatar(data: any) {
  return request('/api/system/user/update_avatar/', {
    method: 'put',
    data: data
  })
}
