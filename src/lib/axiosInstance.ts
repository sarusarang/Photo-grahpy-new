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

const rawBaseURL = (import.meta.env.VITE_API_BASE_URL || "https://pv0smzkc-8000.inc1.devtunnels.ms/api").trim();
const normalizedBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

// Axios instance
export const axiosInstance = axios.create({
    baseURL: normalizedBaseURL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
    },
    timeout: 45000,
});

// 🧩 Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        if (config.url) {
            // Normalize path so it resolves relative to baseURL (/api/)
            config.url = config.url.replace(/^\/?api\/v1\/?/, '').replace(/^\/?api\/?/, '').replace(/^\//, '');
        }
        // Authentication is completely cookie-based; strip any manual Authorization header
        if (config.headers?.Authorization) {
            delete config.headers.Authorization;
        }
        if (config.headers?.authorization) {
            delete config.headers.authorization;
        }
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

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthCheckRoute) {
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
                // 🔄 Refresh HTTP-only cookie session
                await axios.post(
                    `${normalizedBaseURL}auth/token/refresh/`,
                    {},
                    { withCredentials: true }
                );

                onRefreshed();
                isRefreshing = false;

                // Retry original request with newly refreshed session cookie
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                onRefreshFailed(refreshError);

                // Notify session expired across the application without relying on localStorage
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("auth:session-expired"));
                }

                toast.error("Session expired", {
                    description: "Please log in again.",
                    duration: 5000,
                });

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
