import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { FiSend, FiTrash2, FiMessageSquare, FiLoader } from 'react-icons/fi';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(BACKEND_BASE);

function ChatBox({ workspaceId, user }) {
  // --- LOGIC (UNCHANGED) ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true); // Added for better UX
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${API_BASE}/messages/${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [workspaceId]);

  useEffect(() => {
    socket.emit("join_workspace", workspaceId);

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    const handleMessageDeleted = (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [workspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const messageData = { sender: user, workspace: workspaceId, content: newMessage };
    socket.emit("send_message", messageData);
    setNewMessage("");
  };

  const handleDeleteMessage = (messageId) => {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.delete(`${API_BASE}/messages/${messageId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      })
      .catch(err => console.error("Failed to delete message:", err));
  };

  // --- UI (REDESIGNED) ---
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Workspace Chat</h3>
      </div>

      {/* Message List */}
      <div className="flex-grow p-4 md:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <FiLoader className="text-4xl text-indigo-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center text-slate-500">
            <FiMessageSquare className="text-5xl mb-4" />
            <h4 className="text-lg font-semibold">No messages yet</h4>
            <p>Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg._id} className={`group flex items-start gap-3 ${msg.sender._id === user._id ? "flex-row-reverse" : ""}`}>
                <img
                  src={msg.sender.profilePicture ? `${BACKEND_BASE}${msg.sender.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=random`}
                  alt={msg.sender.name}
                  className="w-9 h-9 rounded-full shadow-sm"
                />
                <div className={`flex flex-col max-w-md ${msg.sender._id === user._id ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-2 rounded-2xl ${msg.sender._id === user._id ? "bg-indigo-600 text-white rounded-br-lg" : "bg-slate-100 text-slate-800 rounded-bl-lg"}`}>
                    <p className="text-sm font-semibold mb-1">{msg.sender.name}</p>
                    <p className="text-sm leading-snug">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {msg.sender._id === user._id && (
                      <button onClick={() => handleDeleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity" title="Delete message">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                    <p className="text-xs text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Redesigned Input Form */}
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full bg-slate-100 border-transparent rounded-lg px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
            title="Send"
            disabled={!newMessage.trim()}
          >
            <FiSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;