/**
 * Standardized API response types — phản ánh format của Transform Interceptor ở BE.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}
