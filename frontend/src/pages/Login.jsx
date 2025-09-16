import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      
      const decoded = jwtDecode(res.data.token);
      localStorage.setItem("userId", decoded.user.id);
      
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* --- UI ENHANCEMENT: Gradient background for visual appeal --- */}
      <div className="w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 hidden lg:flex items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-white text-4xl font-extrabold mb-4">Welcome Back!</h1>
          <p className="text-indigo-200 text-lg font-light">
            Manage your projects and collaborate with your team in one place.
          </p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Login</h2>
          <p className="text-center text-slate-500 mb-8">Sign in to your SyncSpace account.</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-indigo-600 focus:outline-none transition"
              >
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-transform transform hover:scale-105"
            >
              Login
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-500">
            Don’t have an account?{" "}
            {/* --- UI ENHANCEMENT: Consistent brand color for links --- */}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;