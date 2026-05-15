import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

const CATEGORIES = ["Rice", "Curry", "Breakfast", "Snacks", "Dessert", "Bread", "Soup", "Other"];

function EditModal({ food, onClose, onSaved, API, user, toast, authHeaders }) {
  const [form, setForm] = useState({
    foodItem: food.foodItem, description: food.description || "",
    allergens: food.allergens || "", category: food.category,
    servings: food.servings, pickupLocation: food.pickupLocation || "",
    contactNumber: food.contactNumber || ""
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${API}/foods/${food._id}`, { ...form, donorEmail: user.email }, authHeaders);
      toast("Listing updated! Pending re-approval.");
      onSaved(data);
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Listing</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Food Item *</label>
              <input className="form-control" name="foodItem" value={form.foodItem} onChange={handle} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-control" name="category" value={form.category} onChange={handle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Description</label>
            <textarea className="form-control" name="description" rows={2} value={form.description} onChange={handle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Allergens</label>
              <input className="form-control" name="allergens" value={form.allergens} onChange={handle} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Servings</label>
              <input className="form-control" type="number" name="servings" min="1" value={form.servings} onChange={handle} />
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Pickup Location</label>
            <input className="form-control" name="pickupLocation" value={form.pickupLocation} onChange={handle} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Contact Number</label>
            <input className="form-control" name="contactNumber" value={form.contactNumber} onChange={handle} />
          </div>
          <p style={{ fontSize: 12, color: "var(--gray)" }}>Note: Editing will reset the listing to Pending for re-approval.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

export default function MyListings() {
  const { user, API, toast, authHeaders } = useAuth();
  const [foods, setFoods] = useState([]);
  const [donorOrders, setDonorOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("listings");
  const [editFood, setEditFood] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    Promise.all([
      axios.get(`${API}/foods/mine?email=${user.email}`, authHeaders),
      axios.get(`${API}/orders/donor?email=${user.email}`, authHeaders)
    ]).then(([f, o]) => { setFoods(f.data); setDonorOrders(o.data); })
      .catch(() => toast("Failed to load data", "error"))
      .finally(() => setLoading(false));
  }, []);

  const deleteFood = async (id) => {
    try {
      await axios.delete(`${API}/foods/${id}?donorEmail=${encodeURIComponent(user.email)}`, authHeaders);
      setFoods(f => f.filter(x => x._id !== id));
      toast("Listing removed");
    } catch (err) { toast(err.response?.data?.message || "Failed to delete", "error"); }
  };

  const getExpiry = (createdAt, noExpiry) => {
    if (noExpiry) return <span style={{ color: "var(--primary)", fontSize: 12 }}>No expiry</span>;
    const diff = new Date(createdAt).getTime() + 2 * 60 * 60 * 1000 - Date.now();
    if (diff <= 0) return <span style={{ color: "var(--danger)", fontSize: 12 }}>Expired</span>;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const label = hrs > 0 ? `${hrs}h ${mins % 60}m left` : `${mins}m left`;
    return <span style={{ color: diff < 30 * 60000 ? "#e67e22" : "var(--primary)", fontSize: 12 }}>⏱ {label}</span>;
  };

  const statusBadge = (s) => {
    if (s === "Approved") return <span className="badge badge-success">Approved</span>;
    if (s === "Rejected") return <span className="badge badge-danger">Rejected</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>My Listings 📋</h1>
          <p>Manage your food donations and see who claimed them</p>
        </div>
      </div>

      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`btn btn-sm ${tab === "listings" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("listings")}>My Listings ({foods.length})</button>
            <button className={`btn btn-sm ${tab === "claimed" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("claimed")}>Who Claimed ({donorOrders.length})</button>
          </div>
          <Link to="/donate" className="btn btn-primary btn-sm">+ Post New Food</Link>
        </div>

        {loading ? <div className="spinner" /> : tab === "listings" ? (
          foods.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 56 }}>📋</div>
              <h3>No listings yet</h3>
              <Link to="/donate" className="btn btn-primary" style={{ marginTop: 16 }}>Post Food Now</Link>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Food Item</th><th>Category</th><th>Servings</th><th>Pickup Location</th><th>Status</th><th>Expires In</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {foods.map(f => (
                      <tr key={f._id}>
                        <td><strong>{f.foodItem}</strong></td>
                        <td><span className="badge badge-info">{f.category}</span></td>
                        <td>{f.servings}</td>
                        <td style={{ fontSize: 13, color: "var(--gray)" }}>{f.pickupLocation || "—"}</td>
                        <td>{statusBadge(f.status)}</td>
                        <td>
                          {f.status === "Rejected" && f.rejectionReason
                            ? <span style={{ fontSize: 12, color: "var(--danger)" }} title={f.rejectionReason}>⚠ {f.rejectionReason}</span>
                            : getExpiry(f.createdAt, f.noExpiry)
                          }
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditFood(f)}>✏ Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ id: f._id, name: f.foodItem })}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          donorOrders.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 56 }}>📦</div>
              <h3>Nobody has claimed your food yet</h3>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {donorOrders.map(order => (
                <div key={order._id} className="card">
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{order.userName}</div>
                        <div style={{ fontSize: 12, color: "var(--gray)" }}>{new Date(order.placedAt).toLocaleString()}</div>
                      </div>
                      <span className="badge badge-success">{order.status}</span>
                    </div>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--gray-light)", borderRadius: "var(--radius-sm)", marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>🍽</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{item.foodItem}</div>
                          {item.pickedUp && <span className="badge badge-success" style={{ fontSize: 11 }}>✓ Picked Up</span>}
                          {item.rating && <div style={{ fontSize: 12, color: "#f39c12" }}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)} {item.comment && `· "${item.comment}"`}</div>}
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--primary)" }}>{item.quantity} serving{item.quantity > 1 ? "s" : ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {editFood && (
        <EditModal
          food={editFood}
          onClose={() => setEditFood(null)}
          onSaved={updated => setFoods(f => f.map(x => x._id === updated._id ? updated : x))}
          API={API} user={user} toast={toast} authHeaders={authHeaders}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Remove Listing"
          message={`Remove "${confirmDelete.name}" permanently? This cannot be undone.`}
          confirmLabel="Remove"
          onConfirm={() => deleteFood(confirmDelete.id, confirmDelete.name)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
