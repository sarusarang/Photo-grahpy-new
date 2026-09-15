import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";
import { toast } from "sonner";



// Token refresh handling
let isRefreshing = false;
let refreshSubscribers: Array<{
    resolve: () => void;
    reject: (error: any) => void;
}> = [];

// Notify all subscribers once token is refreshed
const onRefreshed = () => {
    refreshSubscribers.forEach((subscriber) => subscriber.resolve());
    refreshSubscribers = [];
};

// Reject all waiting subscribers if token refresh fails
const onRefreshFailed = (error: any) => {
    refreshSubscribers.forEach((subscriber) => subscriber.reject(error));
    refreshSubscribers = [];
};

// Axios instance
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

// 🧩 Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => Promise.reject(error)
);

// 🧩 Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const url = originalRequest?.url || "";
        const isAuthCheckRoute =
            url.includes("/auth/check-login/") ||
            url.includes("/auth/token/refresh/") ||
            url.includes("/auth/login/") ||
            url.includes("/auth/logout/") ||
            url.includes("/auth/passwordless/") ||
            url.includes("/photographers/onboarding/");

        // Only attempt token refresh if the user previously had an active session
        const hasAuthSession =
            localStorage.getItem("photo_saas_auth_v2") === "true" ||
            !!localStorage.getItem("photo_saas_user_v2");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthCheckRoute && hasAuthSession) {
            originalRequest._retry = true;

            // Prevent multiple parallel refresh calls
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshSubscribers.push({
                        resolve: () => resolve(axiosInstance(originalRequest)),
                        reject: (err) => reject(err),
                    });
                });
            }

            isRefreshing = true;

            try {
                // 🔄 Try refresh token
                await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/api/auth/token/refresh/`,
                    {},
                    { withCredentials: true }
                );

                onRefreshed();
                isRefreshing = false;

                // Retry original request
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                onRefreshFailed(refreshError);

                toast.error("Session expired", {
                    description: "Please log in again.",
                    duration: 5000,
                });

                // Clear cached auth flags and sync logout across tabs
                localStorage.removeItem("photo_saas_auth_v2");
                localStorage.removeItem("photo_saas_user_v2");
                localStorage.setItem("logout", Date.now().toString());

                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        const status = error?.response?.status;
        const data = error?.response?.data;
        const message =
            (data as any)?.message ||
            (data as any)?.detail ||
            error?.message ||
            "Something went wrong, please try again.";

        return Promise.reject({ status, message, data });
    }
);

export default axiosInstance;
