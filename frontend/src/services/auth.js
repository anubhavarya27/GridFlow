import { API_BASE_URL } from "./config";

const AUTH_KEY = "gridpulse_session";

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
        // the existing AdminRoute / UI logic.  The role stored here only
        // drives what the UI shows; the backend authorizes every request
        // from the signed token, so editing it grants nothing.
        const session = {
            token: result.data.token,
            user_id: backendUser.user_id,
            username: backendUser.username,
            role: backendUser.role.toLowerCase(),
            name:
                backendUser.role === "ADMIN"
                    ? "GridPulse Administrator"
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

/**
 * Verify the administrator's approval password to unlock the Approvals page.
 * This is a UI gate only: the backend also requires the approval password on
 * every approve / reject call.
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
