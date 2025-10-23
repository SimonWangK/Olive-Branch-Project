// @/services/system/case.ts

import { request } from '@umijs/max';




// 获取文档列表
export async function getDocuments(caseId: number) {
  return request<API.Result>(`/api/cases/${caseId}/documents`, {
    method: 'GET'
  });
}

// 上传文档
export async function uploadDocument(caseId: number, file: File, title: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  return request<API.Result>(`/api/cases/${caseId}/documents/upload`, {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

// 创建文档版本
export async function createDocumentVersion(caseId: number, documentId: number, data: { url: string }) {
  return request<API.Result>(`/api/cases/${caseId}/documents/${documentId}/versions`, {
    method: 'POST',
    data
  });
}

// 审批文档版本
export async function approveDocumentVersion(caseId: number, versionId: number) {
  return request<API.Result>(`/api/cases/${caseId}/documents/versions/${versionId}/approve`, {
    method: 'POST'
  });
}

// 下载文件
export async function downloadFile(caseId: number, fileId: string) {
  return request(`/api/cases/${caseId}/documents/file/${fileId}`, {
    method: 'GET',
    responseType: 'blob'
  });
}