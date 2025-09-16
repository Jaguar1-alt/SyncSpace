import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function DocumentsList({ workspaceId, onDocumentSelect }) {
  const [documents, setDocuments] = useState([]);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");

  const fetchDocuments = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_BASE}/documents/workspace/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(res.data);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [workspaceId]);

  const handleCreateDocument = async () => {
    const token = localStorage.getItem("token");
    if (!newDocumentTitle.trim()) {
      alert("Document title cannot be empty.");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/documents`,
        { title: newDocumentTitle, workspaceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments([...documents, res.data]);
      setNewDocumentTitle("");
    } catch (err) {
      console.error("Error creating document:", err);
    }
  };

  return (
    <div>
      <h3 className="text-3xl font-bold mb-4">Documents</h3>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h4 className="text-xl font-semibold mb-4">Create New Document</h4>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Document title"
            value={newDocumentTitle}
            onChange={(e) => setNewDocumentTitle(e.target.value)}
            className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateDocument}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow"
          >
            Create
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-xl font-semibold mb-4">Document List</h4>
        {documents.length === 0 ? (
          <p className="text-gray-600">No documents in this workspace.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li key={doc._id} className="py-4">
                <Link to="#" onClick={() => onDocumentSelect(doc._id)} className="text-lg font-medium text-gray-900 hover:text-blue-600">
                  {doc.title}
                </Link>
                <p className="text-sm text-gray-500">Created by {doc.createdBy.name} on {new Date(doc.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DocumentsList;