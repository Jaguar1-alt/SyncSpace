import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = "http://localhost:5000";

function FileManagement({ workspaceId }) {
  const [files, setFiles] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // State to hold the current user

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
    // Fetch the current user's details on component mount
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token");
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
      await fetchFiles(); // Re-fetch files to update the list
      setFileToUpload(null);
      alert("File uploaded successfully!");
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

  if (loading) {
    return <p className="text-center text-gray-600">Loading files...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div>
      <h3 className="text-3xl font-bold mb-4">Project Files</h3>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h4 className="text-xl font-semibold mb-4">Upload New File</h4>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow"
            disabled={!fileToUpload || uploading}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-xl font-semibold mb-4">File List</h4>
        {files.length === 0 ? (
          <p className="text-gray-600">No files have been uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file._id} className="flex justify-between items-center py-4">
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded by {file.uploader.name} on {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(file._id, file.name)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Download
                  </button>
                  {user && file.uploader._id === user._id && (
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      Delete
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