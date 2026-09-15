import axiosInstance from "@/lib/axiosInstance";



export const CommonApi = async (reqmethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", apiurl: string, reqbody?: any) => {


    try {

        const response = await axiosInstance.request({
            method: reqmethod,
            url: apiurl,
            data: reqbody,
        });

        return response.data;

    } catch (error: any) {

        // Already normalized in interceptor
        throw error;

    }

};
