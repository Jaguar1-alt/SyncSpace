// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import JoinWorkspace from "./pages/JoinWorkspace";
import WorkspaceHub from "./pages/WorkspaceHub";
import Profile from "./pages/Profile";
import Welcome from "./pages/Welcome"; // Import the new Welcome component

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Change the default route to the Welcome page */}
          <Route path="/" element={<Welcome />} />
          
          {/* Authentication and other protected routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/join/:token" element={<JoinWorkspace />} />
          <Route path="/workspace/:workspaceId" element={<WorkspaceHub />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;