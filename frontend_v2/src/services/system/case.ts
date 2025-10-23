
import { request } from '@umijs/max';


export async function getCaseDetail(id: number) {
  return request<API.Result>(`/api/cases/${id}`, {
    method: 'GET'
  });
}


export async function getDashboardStats(params?: any,) {
  return request<API.System.UserPageResult>('/api/cases/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params,
    // ...(options || {})
  });
}


//
export async function getCaseList(params?: any,) {
  return request<API.System.UserPageResult>('/api/cases', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params,
    // ...(options || {})
  });
}

export async function createCase(data: any) {
  return request('/api/cases', {
    method: 'POST',
    data,
  });
}


// Update an existing task for a specific case
export async function updateCase(caseId: number, data: any ,userId:number) {
  return request<API.Result>(`/api/cases/${caseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data, // Task data to update
    
  });
}


// 
export async function closeCase(ids: number) {
  return request<API.Result>(`/api/cases/${ids}/close`, {
    method: 'POST'
  });
}





// Get tasks for a specific case
export async function getTaskList(caseId: number, params?: any) {
  return request<API.Result>(`/api/cases/${caseId}/tasks`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params, // Optional query params for pagination or filters
  });
}

// Create a new task for a specific case
export async function createTask(caseId: number, data: any) {
  return request<API.Result>(`/api/cases/${caseId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data, // Task data to be created
  });
}

// Update an existing task for a specific case
export async function updateTask(caseId: number, taskId: number, data: any) {
  return request<API.Result>(`/api/cases/${caseId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data, // Task data to update
  });
}

// Delete a task from a specific case
export async function deleteTask(caseId: number, taskId: number) {
  return request<API.Result>(`/api/cases/${caseId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}







// Service for getting compliance items for a specific case
export async function getComplianceItems(caseId: number, params: any = {}) {
  return request<API.Result>(`/api/cases/${caseId}/compliance-items`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params, // Optional query params for pagination or filters
  });
}


// Service for creating a compliance item
export async function createComplianceItem(caseId: number, data: any) {
  return request<API.Result>(`/api/cases/${caseId}/compliance-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

// Service for updating a compliance item
export async function updateComplianceItem(caseId: number, itemId: number, data: any) {
  return request<API.Result>(`/api/cases/${caseId}/compliance-items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

// Service for deleting a compliance item
export async function deleteComplianceItem(caseId: number, itemId: number) {
  return request<API.Result>(`/api/cases/${caseId}/compliance-items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}
