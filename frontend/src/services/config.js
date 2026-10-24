/*
 * GridPulse Spring Boot backend.  Same base URL as the U/BILL Express API;
 * override with VITE_API_BASE_URL in frontend/.env if the backend runs elsewhere.
 */
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
