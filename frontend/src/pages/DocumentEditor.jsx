import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import io from "socket.io-client";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(BACKEND_BASE);

function DocumentEditor({ documentId }) {
  const [document, setDocument] = useState(null);
  const quillRef = useRef(null);
  
  // State to hold the quill instance for safer access
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

    // Initialize the editor and set its content
    const editor = quillRef.current.getEditor();
    editor.setContents(document.content);
    setQuill(editor);

    // Join the document-specific room
    socket.emit("join_document", documentId);
    
    // Listen for changes from other clients
    socket.on("document_update", (delta) => {
      editor.setContents(delta);
    });

    return () => {
      socket.off("document_update");
      socket.emit("leave_document", documentId); // Optional: add a leave event
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

  return (
    <div>
      <h3 className="text-3xl font-bold mb-4">{document.title}</h3>
      <div className="bg-white rounded-lg shadow-md h-[70vh]">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}

export default DocumentEditor;