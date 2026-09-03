import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // ✅ Tự động gửi/nhận cookie kèm mọi request
});

// ─── Request Interceptor ──────────────────────────────────────
// Không cần gắn token thủ công nữa — cookie tự gửi bởi trình duyệt.
// Giữ interceptor cho mục đích mở rộng sau này (logging, etc.)
api.interceptors.request.use((config) => {
  return config;
});

// ─── Response Interceptor ── Xử lý lỗi tập trung ──────────────
api.interceptors.response.use(
  // Nếu response OK → trả về bình thường
  (response) => response,

  // Nếu response lỗi → xử lý tập trung
  async (error) => {
    const originalRequest = error.config;

    // ── 401 Unauthorized → Token hết hạn ──
    // Nếu endpoint refresh cũng 401 thì không retry nữa (tránh loop vô tận)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/session')
    ) {
      originalRequest._retry = true;
      try {
        // Gọi API refresh token (cookie tự gửi kèm)
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Retry request gốc (cookie mới đã được set bởi server)
        return api(originalRequest);
      } catch {
        // Refresh cũng thất bại → buộc logout
        localStorage.removeItem("user");
        // Redirect về login (chỉ khi đang ở client)
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    // ── 403 Forbidden → Không có quyền truy cập ──
    if (error.response?.status === 403) {
      console.warn("[Axios] 403 Forbidden:", error.response?.data?.message);
    }

    // ── 500+ Server Error → Log để debug ──
    if (error.response?.status >= 500) {
      console.error("[Axios] Server Error:", error.response?.status, error.response?.data);
    }

    return Promise.reject(error);
  }
);