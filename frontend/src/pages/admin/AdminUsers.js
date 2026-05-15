import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

const LIMIT = 10;

export default function AdminUsers() {
  const { API, toast, authHeaders } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/users?page=${p}&limit=${LIMIT}`, authHeaders);
      setUsers(data.data || data);
      setTotalPages(data.pages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(1); }, []);

  const toggleBlock = async (id, blocked) => {
    try {
      const { data } = await axios.patch(`${API}/users/${id}`, { blocked: !blocked }, authHeaders);
      setUsers(u => u.map(x => x._id === id ? data : x));
      toast(`User ${!blocked ? "blocked" : "unblocked"}`);
    } catch { toast("Action failed", "error"); }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API}/users/${id}`, authHeaders);
      setUsers(u => u.filter(x => x._id !== id));
      toast("User deleted");
    } catch { toast("Delete failed", "error"); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>Manage Users 👥</h1>
          <p>View and manage all registered users</p>
        </div>
      </div>

      <div className="container">
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <input
            className="form-control"
            style={{ maxWidth: 320 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: 14, color: "var(--gray)" }}>{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}>No users found</td></tr>
                    ) : filtered.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.blocked ? "#e0e0e0" : "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: "var(--gray)" }}>{u.email}</td>
                        <td><span className="badge badge-info">{u.role}</span></td>
                        <td>
                          {u.blocked
                            ? <span className="badge badge-danger">Blocked</span>
                            : <span className="badge badge-success">Active</span>
                          }
                        </td>
                        <td style={{ fontSize: 13, color: "var(--gray)" }}>
                          {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className={`btn btn-sm ${u.blocked ? "btn-primary" : "btn-secondary"}`}
                              onClick={() => toggleBlock(u._id, u.blocked)}
                            >
                              {u.blocked ? "Unblock" : "Block"}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ id: u._id, name: u.name })}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => fetchUsers(page - 1)}>← Prev</button>
                <span style={{ alignSelf: "center", fontSize: 14, color: "var(--gray)" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => fetchUsers(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete User"
          message={`Permanently delete "${confirmDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => deleteUser(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
