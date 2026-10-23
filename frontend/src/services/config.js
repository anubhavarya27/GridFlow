const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (
    configuredBaseUrl || "http://localhost:8081/api"
).replace(/\/+$/, "");