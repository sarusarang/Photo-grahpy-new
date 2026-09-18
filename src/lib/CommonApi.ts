import axiosInstance from "@/lib/axiosInstance";

export const CommonApi = async <T = unknown>(
  reqmethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  apiurl: string,
  reqbody?: unknown
): Promise<T> => {
  const response = await axiosInstance.request<T>({
    method: reqmethod,
    url: apiurl,
    data: reqbody,
  });

  return response.data;
};
