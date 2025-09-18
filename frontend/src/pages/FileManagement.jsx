import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiFile, FiFileText, FiImage, FiUploadCloud, FiDownload, FiTrash2, FiLoader, FiAlertCircle, FiFolder } from "react-icons/fi"; // Icon imports
import { FaFilePdf, FaFileWord, FaFileExcel } from "react-icons/fa"; // More specific icons

// API constants remain the same
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Helper function to get a file-type specific icon
const getFileTypeIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return <FaFilePdf className="text-red-500 text-2xl" />;
    case 'doc':
    case 'docx':
      return <FaFileWord className="text-blue-500 text-2xl" />;
    case 'xls':
    case 'xlsx':
      return <FaFileExcel className="text-green-500 text-2xl" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return <FiImage className="text-purple-500 text-2xl" />;
    case 'txt':
      return <FiFileText className="text-gray-500 text-2xl" />;
    default:
      return <FiFile className="text-gray-500 text-2xl" />;
  }
};

function FileManagement({ workspaceId }) {
  // All state and logic hooks are unchanged
  const [files, setFiles] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // All functions (fetchFiles, handleFileChange, etc.) are unchanged
  const fetchFiles = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/files/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const userRes = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    fetchCurrentUser();
    fetchFiles();
  }, [workspaceId]);

  const handleFileChange = (e) => {
    setFileToUpload(e.target.files[0]);
  };

  const handleUpload = async () => {
    const token = localStorage.getItem("token");
    if (!fileToUpload || !token) {
      alert("Please select a file to upload.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      await axios.post(`${API_BASE}/files/upload/${workspaceId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchFiles();
      setFileToUpload(null);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to download files.");
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/files/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download file. Please try again.");
    }
  };

  const handleDelete = async (fileId) => {
    const token = localStorage.getItem("token");
    if (!token || !window.confirm("Are you sure you want to delete this file?")) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchFiles();
      alert("File deleted successfully.");
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file.");
    }
  };

  // --- NEW UI Rendering Starts Here ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <FiLoader className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
        <FiAlertCircle className="text-2xl mr-3"/>
        <div>
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 text-center">Project Files</h2>
      
      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Upload New File</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-grow w-full flex items-center justify-center px-4 py-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <FiUploadCloud className="text-blue-600 mr-2"/>
            <span className="text-gray-700 font-medium">
              {fileToUpload ? fileToUpload.name : "Choose a file to upload"}
            </span>
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
          <button
            onClick={handleUpload}
            className="w-full sm:w-auto flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-blue-300 disabled:cursor-not-allowed disabled:transform-none"
            disabled={!fileToUpload || uploading}
          >
            {uploading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              "Upload File"
            )}
          </button>
        </div>
      </div>

      {/* File List Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Available Files</h3>
        {files.length === 0 ? (
          <div className="text-center py-10">
            <FiFolder className="mx-auto text-5xl text-gray-400 mb-4"/>
            <p className="text-gray-500">No files have been uploaded to this project yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {files.map((file) => (
              <li
                key={file._id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  {getFileTypeIcon(file.name)}
                  <div>
                    <p className="text-md font-semibold text-gray-900 break-all">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded by {file.uploader.name} on {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDownload(file._id, file.name)}
                    className="p-2 text-gray-600 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-colors"
                    title="Download File"
                  >
                    <FiDownload size={20} />
                  </button>
                  {user && file.uploader._id === user._id && (
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="p-2 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                      title="Delete File"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FileManagement;