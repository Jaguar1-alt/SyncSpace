import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const validatePassword = (pw) => {
    if (pw.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(pw)) return "Password must contain a number.";
    if (!/[!@#$%^&*()]/.test(pw)) return "Password must contain a symbol.";
    return "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }
    setPasswordError("");

    try {
      await axios.post(`${API}/auth/register`, { name, email, password, role });
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* --- UI ENHANCEMENT: Gradient background for visual appeal --- */}
      <div className="w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 hidden lg:flex items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-white text-4xl font-extrabold mb-4">Welcome to SyncSpace</h1>
          <p className="text-indigo-200 text-lg font-light">
            An all-in-one collaborative platform for teams.
          </p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Create Account</h2>
          <p className="text-center text-slate-500 mb-8">Start collaborating with your team today.</p>
          <form onSubmit={handleRegister} className="space-y-5">
            <input
              type="text"
              placeholder="Name"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  passwordError ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
                } transition`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                }}
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
            {passwordError && <p className="text-red-500 text-xs -mt-2 px-1">{passwordError}</p>}
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-transform transform hover:scale-105"
            >
              Register
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;