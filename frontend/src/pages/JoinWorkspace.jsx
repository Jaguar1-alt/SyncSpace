import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const JoinWorkspace = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const jwt = localStorage.getItem("token");

  useEffect(() => {
    if (token && jwt) {
      axios
        .post(
          `http://localhost:5000/api/workspaces/join/${token}`,
          {},
          { headers: { Authorization: `Bearer ${jwt}` } }
        )
        .then((res) => {
          setMsg(res.data.msg);
          setTimeout(() => navigate("/dashboard"), 2000);
        })
        .catch((err) => {
          setMsg(err.response?.data?.msg || "Error joining workspace");
        });
    }
  }, [token, jwt, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg font-semibold">{msg || "Joining workspace..."}</p>
    </div>
  );
};

export default JoinWorkspace;
