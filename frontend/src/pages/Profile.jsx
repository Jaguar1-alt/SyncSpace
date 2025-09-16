import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = "https://syncspace-284m.onrender.com"; // <-- CORRECTED URL

function Profile() {
  const { userId } = useParams();
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isCurrentUser = !userId;

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }
      try {
        const fetchUrl = isCurrentUser ? `${API_BASE}/auth/me` : `${API_BASE}/auth/${userId}`;
        const res = await axios.get(fetchUrl, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to fetch user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate, userId, isCurrentUser]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    const token = localStorage.getItem("token");
    if (!file || !token) {
      alert("Please select a file and log in.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      const res = await axios.post(`${API_BASE}/profile/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setUser({ ...user, profilePicture: res.data.profilePicture });
      alert(res.data.msg);
    } catch (err) {
      alert("Failed to upload profile picture.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (loading) { return (<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>); }
  if (error) { return (<div className="text-center mt-10 p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-lg mx-auto"><p className="font-bold">Error:</p><p>{error}</p></div>); }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Profile Page</h2>
          {isCurrentUser && (
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Logout</button>
          )}
        </div>
        <div className="flex flex-col items-center mb-8">
          <img src={user?.profilePicture ? `${BACKEND_BASE}${user.profilePicture}` : "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"/>
          <h3 className="mt-4 text-2xl font-semibold text-gray-800">{user?.name}</h3>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500">Role: {user?.role}</p>
        </div>
        {isCurrentUser && (
          <div className="border-t pt-6">
            <h4 className="text-xl font-semibold mb-4">Update Profile Picture</h4>
            <div className="flex items-center gap-4">
              <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              <button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg" disabled={!file || uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;