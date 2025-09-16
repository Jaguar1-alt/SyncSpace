import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// FIX: Add this line to import the icons
import { FiSend, FiTrash2 } from 'react-icons/fi';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = "http://localhost:5000";
const socket = io(BACKEND_BASE);

function ChatBox({ workspaceId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${API_BASE}/messages/${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(res.data);
      } catch (err) { console.error("Error fetching messages:", err); }
    };
    fetchMessages();

    socket.emit("join_workspace", workspaceId);
    socket.on("receive_message", (message) => setMessages((prev) => [...prev, message]));
    socket.on("message_deleted", (messageId) => setMessages((prev) => prev.filter((msg) => msg._id !== messageId)));
    return () => {
      socket.off("receive_message");
      socket.off("message_deleted");
    };
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    axios.delete(`${API_BASE}/messages/${messageId}`, { headers: { Authorization: `Bearer ${token}` } })
      .catch(err => console.error("Failed to delete message:", err));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex-grow p-6 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg._id} className={`group flex items-end gap-3 my-2 ${msg.sender._id === user._id ? "flex-row-reverse" : ""}`}>
            <img src={msg.sender.profilePicture ? `${BACKEND_BASE}${msg.sender.profilePicture}` : `https://ui-avatars.com/api/?name=${msg.sender.name}`} alt={msg.sender.name} className="w-8 h-8 rounded-full"/>
            <div className={`max-w-md p-3 rounded-2xl ${msg.sender._id === user._id ? "bg-indigo-600 text-white rounded-br-none" : "bg-slate-200 text-slate-800 rounded-bl-none"}`}>
              <p className="text-sm font-semibold">{msg.sender.name}</p>
              <p>{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {msg.sender._id === user._id && (
              <button onClick={() => handleDeleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition" title="Delete message"><FiTrash2 size={14}/></button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 flex items-center gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full bg-slate-100 border-transparent rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Type a message..."/>
        <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" title="Send"><FiSend /></button>
      </form>
    </div>
  );
}

export default ChatBox;