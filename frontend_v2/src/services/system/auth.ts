import { request } from '@umijs/max';


/** 登录接口 POST /api/login/account */
export async function login(body: API.LoginParams, options?: Record<string, any>) {
  return request<API.LoginResult>('/api/auth/login/', {
    method: 'POST',
    headers: {
      // isToken: false,
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function register(body: API.RegisterParams, options?: Record<string, any>) {
  return request<API.RegisterResult>('/api/auth/register/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

