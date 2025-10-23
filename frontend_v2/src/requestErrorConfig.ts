import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';

// Error handling options: Error types
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}
// Response data format agreed with the backend
interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

/**
 * @name Error handling
 * This is the error handling provided by Pro, you can make your own modifications here.
 * @doc https://umijs.org/docs/max/request#configuration
 */
export const errorConfig: RequestConfig = {
  // Error handling: umi@3's error handling scheme.
  errorConfig: {
    // Throwing errors
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as ResponseStructure;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error; // Throw custom error
      }
    },
    // Error receiving and handling
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      // Our custom errors thrown by errorThrower
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              // do nothing
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: errorMessage,
                message: errorCode,
              });
              break;
            case ErrorShowType.REDIRECT:
              // TODO: redirect
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        // Axios errors
        // The request was successfully sent, and the server responded with a status code
        message.error(`Response status:${error.response.status}`);
      } else if (error.request) {
        // The request was sent, but no response was received
        // `error.request` is the XMLHttpRequest instance in browsers,
        // and the http.ClientRequest instance in node.js
        message.error('No response! Please retry.');
      } else {
        // Something went wrong while sending the request
        message.error('Request error, please retry.');
      }
    },
  },

  // Request interceptors
  requestInterceptors: [
    (config: RequestOptions) => {
      // Intercept the request configuration and perform personalized processing.
      const url = config?.url?.concat('?token=123');
      return { ...config, url };
    },
  ],

  // Response interceptors
  responseInterceptors: [
    (response) => {
      // Intercept the response data and perform personalized processing
      const { data } = response as unknown as ResponseStructure;

      if (data?.msg === "Request failed") {
        message.error('Request failed!');
      }
      return response;
    },
  ],
};
