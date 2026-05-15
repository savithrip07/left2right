import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

function RejectModal({ food, onClose, onRejected, API, toast, authHeaders }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await axios.patch(`${API}/foods/${food._id}`, { status: "Rejected", rejectionReason: reason || "Did not meet listing guidelines" }, authHeaders); // eslint-disable-line
      toast("Food rejected");
      onRejected(data);
      onClose();
    } catch { toast("Action failed", "error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reject Listing</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: 12 }}>Rejecting: <strong>{food.foodItem}</strong> by {food.donorName}</p>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Reason (shown to donor)</label>
            <textarea className="form-control" rows={3} placeholder="e.g. Insufficient description, unsafe food, duplicate listing..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={submit} disabled={loading}>{loading ? "Rejecting..." : "Reject Listing"}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFoods() {
  const { API, toast, authHeaders } = useAuth();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const fetch = async (p = 1) => {
    setLoading(true);
    const { data } = await axios.get(`${API}/foods/all?page=${p}&limit=${LIMIT}`, authHeaders);
    const list = data.data || data;
    setFoods(list);
    setTotalPages(data.pages || 1);
    setPage(p);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(1); }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/foods/${id}`, { status }, authHeaders);
      setFoods(f => f.map(x => x._id === id ? { ...x, status } : x));
      toast(`Food ${status.toLowerCase()} successfully`);
    } catch { toast("Action failed", "error"); }
  };

  const toggleStock = async (id, inStock) => {
    try {
      await axios.patch(`${API}/foods/${id}`, { inStock: !inStock }, authHeaders);
      setFoods(f => f.map(x => x._id === id ? { ...x, inStock: !inStock } : x));
    } catch { toast("Action failed", "error"); }
  };

  const deleteFood = async (id) => {
    try {
      await axios.delete(`${API}/foods/${id}`, authHeaders);
      setFoods(f => f.filter(x => x._id !== id));
      toast("Food deleted");
    } catch { toast("Delete failed", "error"); }
  };

  const filtered = filter === "All" ? foods : foods.filter(f => f.status === filter);

  const statusBadge = (s) => {
    if (s === "Approved") return <span className="badge badge-success">Approved</span>;
    if (s === "Rejected") return <span className="badge badge-danger">Rejected</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>Manage Food Listings 🍽</h1>
          <p>Review, approve, and manage all food donations</p>
        </div>
      </div>

      <div className="container">
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["All", "Pending", "Approved", "Rejected"].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f)}>
              {f} {f !== "All" && <span style={{ marginLeft: 4, background: "rgba(255,255,255,0.3)", borderRadius: 10, padding: "1px 6px", fontSize: 11 }}>
                {foods.filter(x => x.status === f).length}
              </span>}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 14, color: "var(--gray)", alignSelf: "center" }}>{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Donor</th>
                    <th>Category</th>
                    <th>Servings</th>
                    <th>Pickup</th>
                    <th>Status</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}>No listings found</td></tr>
                  ) : filtered.map(f => (
                    <tr key={f._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{f.foodItem}</div>
                        {f.description && <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>{f.description.slice(0, 50)}...</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: 14 }}>{f.donorName}</div>
                        <div style={{ fontSize: 12, color: "var(--gray)" }}>{f.donorEmail}</div>
                      </td>
                      <td><span className="badge badge-info">{f.category}</span></td>
                      <td style={{ fontWeight: 600 }}>{f.servings}</td>
                      <td style={{ fontSize: 12, color: "var(--gray)", maxWidth: 140 }}>{f.pickupLocation || "—"}</td>
                      <td>{statusBadge(f.status)}</td>
                      <td>
                        <button
                          className={`badge ${f.inStock ? "badge-success" : "badge-gray"}`}
                          style={{ cursor: "pointer", border: "none" }}
                          onClick={() => toggleStock(f._id, f.inStock)}
                        >
                          {f.inStock ? "In Stock" : "Out"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {f.status !== "Approved" && (
                            <button className="btn btn-primary btn-sm" onClick={() => updateStatus(f._id, "Approved")}>✓</button>
                          )}
                          {f.status !== "Rejected" && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setRejectTarget(f)}>✕</button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteId(f._id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => fetch(page - 1)}>← Prev</button>
            <span style={{ alignSelf: "center", fontSize: 14, color: "var(--gray)" }}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => fetch(page + 1)}>Next →</button>
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          food={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={updated => setFoods(f => f.map(x => x._id === updated._id ? updated : x))}
          API={API} toast={toast} authHeaders={authHeaders}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          title="Delete Listing"
          message="Permanently delete this food listing? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => deleteFood(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
