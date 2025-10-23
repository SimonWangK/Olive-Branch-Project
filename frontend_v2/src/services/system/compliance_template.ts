
import { request } from '@umijs/max';


export async function getComplianceTemplateList(params?: any,) {
  return request<API.System.UserPageResult>('/api/compliance_template/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params,

  });
}



// export async function updateComplianceTemplate(data: {
//   title?: string;
//   mandatory?: boolean;
//   due_days?: number;
// },id: number) {
//   return request<API.Result>(`/api/compliance_template/${id}`, {
//     method: 'PUT',
//     data,
//   });
// }


export async function addComplianceTemplate(data:any) {
  return request<API.Result>('/api/compliance_template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: data
  });
}


// 
export async function removeComplianceTemplate(ids: number) {
  return request<API.Result>(`/api/compliance_template/${ids}`, {
    method: 'DELETE'
  });
}


