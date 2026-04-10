import { useState } from "react";
import api from "../services/api";

const FileUpload = ({ onUploadSuccess, category = "document" }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    
    try {
      const response = await fetch(`${api.invites ? api.API_BASE_URL : import.meta.env.VITE_API_URL}/uploads/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("w3i_token")}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        onUploadSuccess?.(data);
      } else {
        setError(data.detail || "Upload failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-700">Upload {category}</label>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <p className="text-sm text-cyan-600">Uploading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;