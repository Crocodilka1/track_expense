import { User } from "lucide-react"
import { loginStyles } from "../assets/dummyStyles"
import { useState } from "react"
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ onLogin, API_URL = 'http://localhost:4000/api' }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const fetchProfile = async (token) => {
        if (!token) return null;
        const res = await axios.get(`${API_URL}/user/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    const persistAuth = (profile, token) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        try {
            if (token) storage.setItem('token', token);
            if (profile) storage.setItem('user', JSON.stringify(profile));
        } catch (err) {
            console.error('Storage Error:', err);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/user/login`, {email, password}, { headers: {
                'Content-Type': 'application/json'
            }})

            const data = res.data || {};
            const token = data.token || null;

            let profile = data.user ?? null;
            if (!profile) {
                const copy = {...data};
                delete copy.token;
                delete copy.user;

                if (Object.keys(copy).length) {
                    profile = copy;
                }
            }

            if (!profile && token) {
                try {
                    profile = await fetchProfile(token);
                } catch (fetchErr) {
                    console.warn("Could not fetch profile after login token:", fetchErr);
                    profile = { email };
                }
            }

            if (!profile) profile = { email };
            persistAuth(profile, token);

            if (typeof onLogin === 'function') {
                try {
                    onLogin(profile, rememberMe, token);
                } catch (callErr) {
                    console.warn("onLogin threw:", callErr);
                    navigate('/');
                }
            } else {
                navigate('/');
            }
            setPassword('');
        } catch (err) {
            console.error('Login error:', err?.response || err);
            const serverMsg = err?.response?.data?.message || (err.response?.data ? JSON.stringify(err.response.data) : null) || err.message || "Login failed";
            setError(serverMsg);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={loginStyles.pageContainer}>
            <div className={loginStyles.cardContainer}>
                <div className={loginStyles.header}>
                    <div className={loginStyles.avatar}>
                        <User className=" w-10 h-10 text-white" />
                    </div>
                    <h1 className={loginStyles.headerTitle}>
                        Welcome Back
                    </h1>
                    <p className={loginStyles.headerSubtitle}>
                        Sign in to your ExpenseTracker account
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login