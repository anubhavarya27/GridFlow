const AUTH_KEY = "ubill_session";
const API_BASE_URL = "http://localhost:5000/api";

export async function login(username, password, role) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
                role: role.toUpperCase(),
            }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            return {
                success: false,
                message: result.message || "Login failed",
            };
        }

        const backendUser = result.data.user;

        // Keep the frontend role format compatible with
        // the existing AdminRoute / UI logic.
        const session = {
            token: result.data.token,
            user_id: backendUser.user_id,
            username: backendUser.username,
            role: backendUser.role.toLowerCase(),
            name:
                backendUser.role === "ADMIN"
                    ? "U/BILL Administrator"
                    : backendUser.username,
        };

        localStorage.setItem(
            AUTH_KEY,
            JSON.stringify(session)
        );

        return {
            success: true,
            user: session,
        };
    } catch (error) {
        console.error("Login error:", error);

        return {
            success: false,
            message:
                "Unable to connect to the backend server.",
        };
    }
}

export function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem("ubill_approval_token");
}

export function getSession() {
    const session = localStorage.getItem(AUTH_KEY);

    if (!session) {
        return null;
    }

    try {
        return JSON.parse(session);
    } catch {
        localStorage.removeItem(AUTH_KEY);
        return null;
    }
}

export function isLoggedIn() {
    return !!getSession()?.token;
}

export function isAdmin() {
    return getSession()?.role === "admin";
}

export function getAuthToken() {
    return getSession()?.token || null;
}

export function getApprovalToken() {
    return localStorage.getItem("ubill_approval_token");
}

/**
 * Verify the administrator's second approval password.
 * The backend returns a short-lived approval token.
 */
export async function verifyApproval(approvalPassword) {
    const session = getSession();

    if (!session?.token) {
        return {
            success: false,
            message: "You are not authenticated.",
        };
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/verify-approval`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.token}`,
                },
                body: JSON.stringify({
                    approvalPassword,
                }),
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            return {
                success: false,
                message:
                    result.message ||
                    "Approval verification failed",
            };
        }

        localStorage.setItem(
            "ubill_approval_token",
            result.data.approvalToken
        );

        return {
            success: true,
        };
    } catch {
        return {
            success: false,
            message:
                "Unable to connect to the backend server.",
        };
    }
}