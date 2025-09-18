import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Snow theme for styling
import io from "socket.io-client";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(BACKEND_BASE);

// --- NEW: Define the custom toolbar options ---
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }, { 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
    [
      { 'list': 'ordered' }, { 'list': 'bullet' },
      { 'indent': '-1' }, { 'indent': '+1' }
    ],
    [{ 'align': [] }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

function DocumentEditor({ documentId }) {
  // All state and logic remains the same
  const [document, setDocument] = useState(null);
  const quillRef = useRef(null);
  const [quill, setQuill] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${API_BASE}/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocument(res.data);
      } catch (err) {
        console.error("Error fetching document:", err);
      }
    };
    fetchDocument();
  }, [documentId]);

  useEffect(() => {
    if (!document || !quillRef.current) return;
    const editor = quillRef.current.getEditor();
    editor.setContents(document.content);
    setQuill(editor);
    socket.emit("join_document", documentId);
    socket.on("document_update", (delta) => {
      editor.setContents(delta);
    });
    return () => {
      socket.off("document_update");
      socket.emit("leave_document", documentId);
    };
  }, [document, documentId]);

  useEffect(() => {
    if (!quill) return;
    const handleChange = (delta, oldDelta, source) => {
      if (source === "user") {
        socket.emit("document_change", { documentId, delta: quill.getContents() });
      }
    };
    quill.on("text-change", handleChange);
    return () => {
      quill.off("text-change", handleChange);
    };
  }, [quill, documentId]);

  if (!document) {
    return <p className="text-center">Loading document...</p>;
  }

  // --- UPDATED: The JSX with the new modules and improved styling ---
  return (
    <div>
      <h3 className="text-3xl font-bold mb-4">{document.title}</h3>
      {/* The container now uses flexbox to manage height correctly */}
      <div className="bg-white rounded-lg shadow-md h-[70vh] flex flex-col">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          modules={quillModules} // Pass the custom modules here
          className="flex-grow" // Make the editor fill the available space
          style={{ border: 'none' }} // Optional: remove the default border
        />
      </div>
    </div>
  );
}

export default DocumentEditor;