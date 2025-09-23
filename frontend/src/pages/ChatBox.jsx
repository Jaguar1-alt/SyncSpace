import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { FiSend, FiTrash2, FiMessageSquare, FiLoader, FiX, FiCheckSquare } from 'react-icons/fi';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(BACKEND_BASE);

function ChatBox({ workspaceId, user }) {
  // --- STATE AND REFS ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // --- NEW STATE for multi-select ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- SIDE EFFECTS ---

  // Fetch initial messages
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
    if (workspaceId) {
      fetchMessages();
    }
  }, [workspaceId]);

  // Set up real-time listeners
  useEffect(() => {
    socket.emit("join_workspace", workspaceId);

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    
    // Listener for single message deletion
    const handleMessageDeleted = (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    // NEW: Listener for multiple message deletion
    const handleMessagesDeleted = (messageIds) => {
      setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg._id)));
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("messages_deleted", handleMessagesDeleted); // 👈 Add new listener

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("messages_deleted", handleMessagesDeleted); // 👈 Clean up listener
    };
  }, [workspaceId]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- HANDLERS ---

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${API_BASE}/messages`, { content: newMessage, workspaceId: workspaceId }, { headers: { Authorization: `Bearer ${token}` } });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleToggleSelection = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedMessages([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    if (!window.confirm(`Delete ${selectedMessages.length} messages? This cannot be undone.`)) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { 
          messageIds: selectedMessages,
          workspaceId: workspaceId 
        }
      });
      // The real-time event "messages_deleted" will handle the UI update
      cancelSelectionMode();
    } catch (err) {
      console.error("Failed to delete selected messages:", err);
    }
  };

  // --- UI ---
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg border border-slate-200">
      
      <div className="p-4 border-b border-slate-200 flex items-center justify-between min-h-[65px]">
        {!isSelectionMode ? (
          <>
            <h3 className="text-lg font-semibold text-slate-800">Workspace Chat</h3>
            <button 
              onClick={() => setIsSelectionMode(true)} 
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Select Messages
            </button>
          </>
        ) : (
          <>
            <button onClick={cancelSelectionMode} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
              <FiX /> Cancel
            </button>
            <span className="font-bold text-indigo-600">{selectedMessages.length} Selected</span>
            <button 
              onClick={handleDeleteSelected}
              disabled={selectedMessages.length === 0}
              className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <FiTrash2 /> Delete
            </button>
          </>
        )}
      </div>

      <div className="flex-grow p-4 md:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full"><FiLoader className="text-4xl text-indigo-600 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center text-slate-500">
            <FiMessageSquare className="text-5xl mb-4" />
            <h4 className="text-lg font-semibold">No messages yet</h4>
            <p>Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isSelected = selectedMessages.includes(msg._id);
              const isUserMessage = msg.sender._id === user._id;

              return (
                <div 
                  key={msg._id} 
                  className={`group flex items-start gap-3 relative transition-colors p-2 rounded-lg ${isUserMessage ? "flex-row-reverse" : ""} ${isSelected ? "bg-indigo-100" : ""}`}
                  onClick={isSelectionMode && isUserMessage ? () => handleToggleSelection(msg._id) : undefined}
                >
                  {isSelectionMode && isUserMessage && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isUserMessage ? 'left-4' : 'right-4'} cursor-pointer p-4 z-10`}>
                      <FiCheckSquare className={`text-2xl transition-all ${isSelected ? "text-indigo-600 scale-100" : "text-slate-300 scale-0 group-hover:scale-100"}`} />
                    </div>
                  )}

                  <img
                    src={msg.sender.profilePicture ? `${BACKEND_BASE}${msg.sender.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=random`}
                    alt={msg.sender.name}
                    className="w-9 h-9 rounded-full shadow-sm"
                  />
                  <div className={`flex flex-col max-w-md ${isUserMessage ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2 rounded-2xl ${isUserMessage ? "bg-indigo-600 text-white rounded-br-lg" : "bg-slate-100 text-slate-800 rounded-bl-lg"}`}>
                      <p className="text-sm font-semibold mb-1">{msg.sender.name}</p>
                      <p className="text-sm leading-snug">{msg.content}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full bg-slate-100 border-transparent rounded-lg px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:bg-slate-200"
            placeholder={isSelectionMode ? "Selection mode active" : "Type a message..."}
            disabled={isSelectionMode}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
            title="Send"
            disabled={!newMessage.trim() || isSelectionMode}
          >
            <FiSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;