import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, UserRound, ArrowRight } from "lucide-react";

import "../styles/login.css";
import { login } from "../services/auth";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [role, setRole] = useState("user");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const from =
        location.state?.from?.pathname || "/dashboard";

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (!username.trim() || !password) {
            setError("Enter both username and password.");
            return;
        }

        setLoading(true);

        const result = await login(
            username.trim(),
            password,
            role
        );

        if (!result.success) {
            setError(result.message);
            setLoading(false);
            return;
        }

        navigate(from, { replace: true });
    }

    return (
        <div className="login-page">
            <div className="login-shell">

                <div className="login-brand">
                    <div className="login-logo">U</div>

                    <div>
                        <strong>U/BILL</strong>
                        <span>UTILITY BILLING SYSTEM</span>
                    </div>
                </div>

                <div className="login-card">

                    <div className="login-heading">
                        <span className="login-eyebrow">
                            SECURE ACCESS
                        </span>

                        <h1>Sign in</h1>

                        <p>
                            Access the U/BILL utility management
                            console.
                        </p>
                    </div>

                    <div className="role-switch">

                        <button
                            type="button"
                            className={
                                role === "user" ? "active" : ""
                            }
                            onClick={() => {
                                setRole("user");
                                setUsername("");
                                setPassword("");
                                setError("");
                            }}
                        >
                            <UserRound size={15} />
                            USER
                        </button>

                        <button
                            type="button"
                            className={
                                role === "admin" ? "active" : ""
                            }
                            onClick={() => {
                                setRole("admin");
                                setUsername("");
                                setPassword("");
                                setError("");
                            }}
                        >
                            <ShieldCheck size={15} />
                            ADMIN
                        </button>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <label>
                            Username

                            <input
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                placeholder={
                                    role === "admin"
                                        ? "Administrator username"
                                        : "Username"
                                }
                                autoComplete="username"
                            />
                        </label>

                        <label>
                            Password

                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter password"
                                autoComplete="current-password"
                            />
                        </label>

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                "SIGNING IN..."
                            ) : (
                                <>
                                    SIGN IN
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                    </form>

                    <div className="login-security-note">
                        <span>CONTROLLED ACCESS</span>
                        <p>
                            Credentials are verified securely
                            through the U/BILL backend.
                        </p>
                    </div>

                </div>

                <div className="login-footer">
                    <span>U/BILL</span>
                    <span>CONTROLLED DATABASE ACCESS</span>
                </div>

            </div>
        </div>
    );
}

export default Login;