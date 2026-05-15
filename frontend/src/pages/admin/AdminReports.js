import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function AdminReports() {
  const { API, toast, authHeaders } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/reports`, authHeaders)
      .then(r => setReports(r.data))
      .catch(() => toast("Failed to load reports", "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>Reports 🚩</h1>
          <p>User-submitted reports about food listings</p>
        </div>
      </div>
      <div className="container">
        {loading ? <div className="spinner" /> : reports.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>🚩</div>
            <h3>No reports yet</h3>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Time</th><th>Reported By</th><th>Food Item</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontSize: 13, color: "var(--gray)", whiteSpace: "nowrap" }}>{new Date(r.timestamp).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{r.user}</td>
                      <td style={{ fontSize: 13 }}>{r.target?.split("—")[0]?.trim()}</td>
                      <td style={{ fontSize: 13, color: "var(--danger)" }}>{r.target?.split("—")[1]?.trim()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
