import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { 
    FiLogOut, FiCopy, FiAlertCircle, 
    FiCheckCircle, FiArrowRight, FiInbox, FiUsers, FiTrash, FiEdit,
    FiPlusCircle, FiLink, FiBell, FiX
} from 'react-icons/fi';
import Modal from "../components/Modal"; 
import io from 'socket.io-client';

// --- Constants ---
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(BACKEND_BASE); // Central socket instance

// =================================================================================
// --- Reusable UI Components ---
// =================================================================================

/**
 * @description Notifications dropdown component.
 */
const NotificationsDropdown = ({ notifications, onMarkAsRead, onClose }) => {
    const unreadNotifications = notifications.filter(n => !n.readStatus);

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="text-lg font-bold">Notifications ({unreadNotifications.length})</h4>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                    <FiX size={20} />
                </button>
            </div>
            <div className="py-2">
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm p-4">No new notifications.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {notifications.map(notif => (
                                <li 
                                    key={notif._id} 
                                    className={`flex items-start p-4 transition-colors ${!notif.readStatus ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'}`}
                                >
                                    <div className="flex-grow">
                                        <p className="text-sm">{notif.message}</p>
                                        <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</span>
                                        {!notif.readStatus && (
                                            <button onClick={() => onMarkAsRead(notif._id)} className="ml-2 text-xs text-blue-500 hover:underline">
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * @description Application header with user profile and logout button.
 */
const Header = ({ user, onLogout, unreadCount, onToggleNotifications }) => (
    <header className="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
                <Link to="/dashboard" className="text-2xl font-bold text-indigo-600 tracking-tight">
                    SyncSpace
                </Link>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button 
                            onClick={onToggleNotifications} 
                            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors relative"
                        >
                            <FiBell size={24} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-3 w-3 flex items-center justify-center text-[10px] text-white rounded-full bg-red-500">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                    <Link to="/profile" className="flex items-center gap-3 group">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 hidden sm:block transition-colors">
                            {user?.username}
                        </span>
                        <img
                            src={user?.profilePicture ? `${BACKEND_BASE}${user.profilePicture}` : `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=c7d2fe&color=3730a3`}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-offset-2 ring-transparent group-hover:ring-indigo-500 transition-all duration-300"
                        />
                    </Link>
                    <button
                        onClick={onLogout}
                        aria-label="Logout"
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                        <FiLogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
    </header>
);

/**
 * @description A card representing a single workspace.
 */
const WorkspaceCard = ({ workspace, isAdmin, onCopyInvite, onUpdate, onDelete }) => {
    const inviteLink = `${window.location.origin}/join/${workspace._id}`;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div className="p-6 flex-grow">
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {workspace.name}
                </h3>
                <p className="text-slate-500 mt-2 text-sm flex items-center gap-2">
                    <FiUsers size={14} className="text-indigo-500" />
                    <span>{workspace.memberCount} Members</span>
                </p>
            </div>
            <div className="border-t border-slate-200 bg-slate-50/50 p-4 flex justify-between items-center rounded-b-xl">
                <Link
                    to={`/workspace/${workspace._id}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                >
                    Open Workspace <FiArrowRight />
                </Link>
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.preventDefault(); onUpdate(workspace); }}
                            className="text-slate-500 hover:text-blue-500 transition"
                            title="Update name"
                        >
                            <FiEdit size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); onDelete(workspace); }}
                            className="text-slate-500 hover:text-red-500 transition"
                            title="Delete workspace"
                        >
                            <FiTrash size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onCopyInvite(inviteLink);
                            }}
                            aria-label="Copy invite link"
                            className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-md px-3 py-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                        >
                            <FiCopy size={14} />
                            <span className="hidden sm:inline">Copy Invite</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * @description Animated toast notification for user feedback.
 */
const Toast = ({ message, type, show }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (!isVisible) return null;

    const successStyles = 'bg-green-500 border-green-600';
    const errorStyles = 'bg-red-500 border-red-600';

    return (
        <div 
            className={`fixed top-5 right-5 z-[100] flex items-center p-4 rounded-lg shadow-2xl text-white border-2 transition-all duration-300 ease-in-out
                ${type === 'success' ? successStyles : errorStyles}
                ${show ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-5 opacity-0'}`}
        >
            {type === 'success' ? <FiCheckCircle className="mr-3" size={20} /> : <FiAlertCircle className="mr-3" size={20} />}
            <span className="font-medium">{message}</span>
        </div>
    );
};

/**
 * @description Panel for joining or creating workspaces.
 */
const ActionPanel = ({ onJoin, onAdminCreate, isAdmin }) => {
    const [inviteLink, setInviteLink] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        onJoin(inviteLink);
        setInviteLink("");
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        onAdminCreate(workspaceName);
        setWorkspaceName("");
    };

    return (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-10">
            <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : ''} gap-x-8 gap-y-6 items-end`}>
                <form onSubmit={handleJoinSubmit}>
                    <label htmlFor="join-link" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Join a Workspace
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="join-link" type="text" placeholder="Paste invite link..."
                            value={inviteLink} onChange={(e) => setInviteLink(e.target.value)}
                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition whitespace-nowrap">
                            Join
                        </button>
                    </div>
                </form>

                {isAdmin && (
                    <form onSubmit={handleCreateSubmit}>
                        <label htmlFor="workspace-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Create a New Workspace
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="workspace-name" type="text" placeholder="Your new project..."
                                value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
                                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition whitespace-nowrap">
                                Create
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
};

/**
 * @description A grid of skeleton loaders for the workspace cards.
 */
const WorkspaceGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 h-44 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="mt-8 h-8 bg-slate-100 rounded-b-xl -m-6"></div>
            </div>
        ))}
    </div>
);

/**
 * @description A message shown when the user has no workspaces.
 */
const EmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg bg-white">
        <FiInbox className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-xl font-semibold text-slate-800">No Workspaces Found</h3>
        <p className="mt-1 text-slate-500">Get started by creating a new workspace or joining one with an invite link.</p>
    </div>
);

// =================================================================================
// --- Main Dashboard Component ---
// =================================================================================
function Dashboard() {
    // --- State Management ---
    const [workspaces, setWorkspaces] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState(null);

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [workspaceToUpdate, setWorkspaceToUpdate] = useState(null);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");

    // --- ✅ NOTIFICATION STATE ---
    const [notifications, setNotifications] = useState([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // --- Side Effects ---
    const fetchDashboardData = useCallback(async (token) => {
        try {
            const [userRes, workspacesRes, notificationsRes] = await Promise.all([
                axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/workspaces/my`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/notifications/my`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            setUser(userRes.data);
            setWorkspaces(workspacesRes.data);
            setNotifications(notificationsRes.data);

            if (userRes.data?._id) {
                socket.emit('register_user', userRes.data._id);
            }

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            showToast("Session expired. Please log in again.", "error");
            localStorage.removeItem("token");
            setTimeout(() => navigate("/login"), 2000);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchDashboardData(token);
    }, [fetchDashboardData, navigate]);

    useEffect(() => {
        const handleNewNotification = (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            showToast("You have a new notification!", "success");
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, []);

    // --- Helper Functions & Event Handlers ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type }), 3000);
    };

    const handleToggleNotifications = () => {
        setIsNotificationsOpen(prev => !prev);
    };

    const handleMarkAsRead = async (notificationId) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                `${API_BASE}/notifications/mark-read/${notificationId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications(prev =>
                prev.map(n => (n._id === notificationId ? { ...n, readStatus: true } : n))
            );
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
            showToast("Could not update notification.", "error");
        }
    };

    const handleCreateWorkspace = async (workspaceName) => {
        const token = localStorage.getItem("token");
        if (!workspaceName.trim()) {
            showToast("Workspace name cannot be empty.", "error");
            return;
        }
        try {
            const res = await axios.post(
                `${API_BASE}/workspaces/create`,
                { name: workspaceName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setWorkspaces(prev => [...prev, res.data.workspace]);
            showToast("Workspace created successfully!", "success");
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to create workspace.", "error");
        }
    };

    const handleJoinByLink = async (inviteLink) => {
        const token = localStorage.getItem("token");
        const inviteCode = inviteLink.split("/").pop();
        if (!inviteCode) {
            showToast("Invalid invite link format.", "error");
            return;
        }
        try {
            const res = await axios.post(
                `${API_BASE}/workspaces/join/${inviteCode}`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!workspaces.some(ws => ws._id === res.data.workspace._id)) {
                setWorkspaces(prev => [...prev, res.data.workspace]);
            }
            showToast("Successfully joined workspace!", "success");
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to join workspace.", "error");
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast("Invite link copied!", "success");
        });
    };

    const openUpdateModal = (workspace) => {
        setWorkspaceToUpdate(workspace);
        setNewWorkspaceName(workspace.name);
        setIsUpdateModalOpen(true);
    };
    const closeUpdateModal = () => setIsUpdateModalOpen(false);
    
    const confirmUpdateWorkspace = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const res = await axios.put(
                `${API_BASE}/workspaces/${workspaceToUpdate._id}`,
                { name: newWorkspaceName.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setWorkspaces(prev => prev.map(ws =>
                ws._id === workspaceToUpdate._id ? { ...ws, name: res.data.name } : ws
            ));
            showToast("Workspace name updated!", "success");
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to update workspace name.", "error");
        } finally {
            closeUpdateModal();
        }
    };

    const openDeleteModal = (workspace) => {
        setWorkspaceToDelete(workspace);
        setIsDeleteModalOpen(true);
    };
    const closeDeleteModal = () => setIsDeleteModalOpen(false);

    const confirmDeleteWorkspace = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.delete(
                `${API_BASE}/workspaces/${workspaceToDelete._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setWorkspaces(prev => prev.filter(ws => ws._id !== workspaceToDelete._id));
            showToast("Workspace deleted successfully!", "success");
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to delete workspace.", "error");
        } finally {
            closeDeleteModal();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const renderWorkspaceContent = () => {
        if (loading) return <WorkspaceGridSkeleton />;
        if (workspaces.length === 0) return <EmptyState />;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map((ws) => (
                    <WorkspaceCard
                        key={ws._id}
                        workspace={ws}
                        isAdmin={user?.role === "admin"}
                        onCopyInvite={copyToClipboard}
                        onUpdate={openUpdateModal}
                        onDelete={openDeleteModal}
                    />
                ))}
            </div>
        );
    };

    const unreadCount = notifications.filter(n => !n.readStatus).length;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header 
                user={user} 
                onLogout={handleLogout}
                unreadCount={unreadCount}
                onToggleNotifications={handleToggleNotifications}
            />
            <Toast message={toast.message} type={toast.type} show={toast.show} />

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative">
                {isNotificationsOpen && (
                   <div className="absolute top-0 right-4 sm:right-6 lg:right-8 z-50">
                       <NotificationsDropdown 
                           notifications={notifications}
                           onMarkAsRead={handleMarkAsRead}
                           onClose={() => setIsNotificationsOpen(false)}
                       />
                   </div>
                )}
                
                <ActionPanel 
                    onJoin={handleJoinByLink}
                    onAdminCreate={handleCreateWorkspace}
                    isAdmin={user?.role === "admin"}
                />

                <section>
                    <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">
                        Your Workspaces
                    </h2>
                    {renderWorkspaceContent()}
                </section>
            </main>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                title="Delete Workspace"
            >
                <p className="text-slate-600">
                    Are you sure you want to delete the workspace{' '}
                    <strong className="text-slate-800">{workspaceToDelete?.name}</strong>?
                    This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={closeDeleteModal} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 transition">
                        Cancel
                    </button>
                    <button onClick={confirmDeleteWorkspace} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition">
                        Delete
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isUpdateModalOpen}
                onClose={closeUpdateModal}
                title="Update Workspace Name"
            >
                <form onSubmit={confirmUpdateWorkspace}>
                    <label htmlFor="new-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Workspace Name
                    </label>
                    <input
                        id="new-name"
                        type="text"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={closeUpdateModal} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 transition">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition">
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default Dashboard;