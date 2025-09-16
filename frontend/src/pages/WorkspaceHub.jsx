import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

// Components
import KanbanBoard from "./KanbanBoard";
import ChatBox from "./ChatBox";
import FileManagement from "./FileManagement";
import DocumentsList from "./DocumentsList";
import DocumentEditor from "./DocumentEditor";

// --- UI ENHANCEMENT: Added more icons for a complete UI ---
import { FiLayout, FiMessageSquare, FiFileText, FiFolder, FiUsers, FiArrowLeft, FiChevronsLeft, FiMenu, FiX } from "react-icons/fi";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = "http://localhost:5000";

const navItems = [
  { id: "kanban", label: "Kanban Board", icon: <FiLayout size={20} />, description: "Organize tasks and track progress." },
  { id: "chat", label: "Team Chat", icon: <FiMessageSquare size={20} />, description: "Communicate with your team in real-time." },
  { id: "files", label: "Project Files", icon: <FiFolder size={20} />, description: "Manage and share important assets." },
  { id: "documents", label: "Documents", icon: <FiFileText size={20} />, description: "Collaborate on shared documents." },
  { id: "members", label: "Team Members", icon: <FiUsers size={20} />, description: "View and manage workspace members." },
];

function WorkspaceHub() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("kanban");
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for mobile sidebar

  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }
      try {
        const [workspaceRes, userRes] = await Promise.all([
          axios.get(`${API_BASE}/workspaces/${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setWorkspace(workspaceRes.data);
        setUser(userRes.data);
      } catch (err) {
        setError("Failed to load workspace data.");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaceDetails();
  }, [workspaceId, navigate]);
  
  const handleDocumentSelect = (docId) => setSelectedDocumentId(docId);
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setSelectedDocumentId(null);
    setIsSidebarOpen(false); // Close sidebar on tab click
  };
  const handleBackToDocs = () => setSelectedDocumentId(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 p-4">
        <div className="text-center p-8 bg-white border border-red-200 rounded-lg shadow-lg max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  
  }

  const activeNavItem = navItems.find(item => item.id === activeTab);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden p-4 absolute top-0 left-0 z-50">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md bg-white shadow-md text-slate-600">
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar (Responsive) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white text-slate-800 flex flex-col shadow-sm border-r border-slate-200 lg:static lg:flex transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-lg font-bold text-xl">
            {workspace?.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 truncate">{workspace?.name}</h1>
            <Link to="/dashboard" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <FiChevronsLeft/> All Workspaces
            </Link>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors relative ${
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all ${activeTab === item.id ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        {user && (
          <div className="p-4 border-t border-slate-200">
            <Link to="/profile" className="flex items-center gap-3 group">
              <img
                src={user.profilePicture ? `${BACKEND_BASE}${user.profilePicture}` : `https://ui-avatars.com/api/?name=${user.name}`}
                alt="User Profile"
                className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-indigo-400 transition"
              />
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm truncate text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Main Header */}
        <header className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 hidden lg:block">
          <h2 className="text-2xl font-bold text-slate-900">{activeNavItem?.label}</h2>
          <p className="text-sm text-slate-500">{activeNavItem?.description}</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === "kanban" && <KanbanBoard workspaceId={workspaceId} />}
          {activeTab === "chat" && user && <ChatBox workspaceId={workspaceId} user={user} />}
          {activeTab === "files" && <FileManagement workspaceId={workspaceId} />}
          {activeTab === "documents" && (
            <div>
              {selectedDocumentId ? (
                <>
                  <button onClick={handleBackToDocs} className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-600 hover:text-slate-900">
                    <FiArrowLeft /> Back to all documents
                  </button>
                  <DocumentEditor documentId={selectedDocumentId} />
                </>
              ) : (
                <DocumentsList workspaceId={workspaceId} onDocumentSelect={handleDocumentSelect} />
              )}
            </div>
          )}
          {activeTab === "members" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {workspace?.members.map((member) => (
                <Link to={`/profile/${member._id}`} key={member._id} className="block group">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 group-hover:border-indigo-400 group-hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <img
                        src={member.profilePicture ? `${BACKEND_BASE}${member.profilePicture}` : `https://ui-avatars.com/api/?name=${member.name}`}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{member.name || member.email}</p>
                        <p className="text-sm text-slate-500">{member.role || "Member"}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WorkspaceHub;