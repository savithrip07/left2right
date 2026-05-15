import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const LIMIT = 20;

const actionColor = (action) => {
  if (action.includes("Deleted") || action.includes("Cancelled")) return "badge-danger";
  if (action.includes("Blocked")) return "badge-warning";
  if (action.includes("Approved")) return "badge-success";
  if (action.includes("Registered") || action.includes("Posted")) return "badge-info";
  return "badge-gray";
};

export default function AdminActivity() {
  const { API, authHeaders } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/activity?page=${p}&limit=${LIMIT}`, authHeaders);
      setLogs(data.data || data);
      setTotalPages(data.pages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>Activity Log 📋</h1>
          <p>Recent platform activity and events</p>
        </div>
      </div>

      <div className="container">
        {loading ? <div className="spinner" /> : logs.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>📋</div>
            <h3>No activity yet</h3>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id}>
                        <td style={{ fontSize: 13, color: "var(--gray)", whiteSpace: "nowrap" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{log.user}</td>
                        <td><span className={`badge ${actionColor(log.action)}`}>{log.action}</span></td>
                        <td style={{ fontSize: 13, color: "var(--gray)" }}>{log.target || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => fetchLogs(page - 1)}>← Prev</button>
                <span style={{ alignSelf: "center", fontSize: 14, color: "var(--gray)" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => fetchLogs(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
