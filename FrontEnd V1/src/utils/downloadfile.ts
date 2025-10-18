import { request } from '@umijs/max';

const mimeMap = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};

/**
 * Parse blob response content and download it
 * @param {*} res Blob response content
 * @param {String} mimeType MIME type
 */
export function resolveBlob(res: any, mimeType: string) {
  const aLink = document.createElement('a');
  const blob = new Blob([res.data], { type: mimeType });
  // Get filename from response headers, set by backend with response.setHeader("Content-disposition", "attachment; filename=xxxx.docx");
  const patt = new RegExp('filename=([^;]+\\.[^\\.;]+);*');
  const contentDisposition = decodeURI(res.headers['content-disposition']);
  const result = patt.exec(contentDisposition);
  let fileName = result ? result[1] : 'file';
  fileName = fileName.replace(/"/g, '');
  aLink.style.display = 'none';
  aLink.href = URL.createObjectURL(blob);
  aLink.setAttribute('download', fileName); // Set the downloaded file name
  document.body.appendChild(aLink);
  aLink.click();
  URL.revokeObjectURL(aLink.href); // Clean up the reference
  document.body.removeChild(aLink);
}

export function downLoadZip(url: string) {
  request(url, {
    method: 'GET',
    responseType: 'blob',
    getResponse: true,
  }).then((res) => {
    resolveBlob(res, mimeMap.zip);
  });
}

export async function downLoadXlsx(url: string, params: any, fileName: string) {
  return request(url, {
    ...params,
    method: 'POST',
    responseType: 'blob',
  }).then((data) => {
    const aLink = document.createElement('a');
    const blob = data as any;
    aLink.style.display = 'none';
    aLink.href = URL.createObjectURL(blob);
    aLink.setAttribute('download', fileName); // Set the downloaded file name
    document.body.appendChild(aLink);
    aLink.click();
    URL.revokeObjectURL(aLink.href); // Clean up the reference
    document.body.removeChild(aLink);
  });
}

export function download(fileName: string) {
  window.location.href = `/api/common/download?fileName=${encodeURI(fileName)}&delete=${true}`;
}
