import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

function RatingStars({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: s <= value ? "#f39c12" : "#ddd", padding: 0 }}
        >★</button>
      ))}
    </div>
  );
}

function RateItem({ orderId, itemIndex, item, API, userName, toast, onRated, authHeaders }) {
  const [rating, setRating] = useState(item.rating || 0);
  const [comment, setComment] = useState(item.comment || "");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!rating) return toast("Please select a rating", "error");
    setSaving(true);
    try {
      await axios.post(`${API}/ratings`, { orderId, itemIndex, rating, comment, reviewerName: userName }, authHeaders);
      toast("Rating submitted!");
      onRated(itemIndex, rating, comment);
      setOpen(false);
    } catch { toast("Failed to submit rating", "error"); }
    finally { setSaving(false); }
  };

  if (item.rating) {
    return (
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--gray)" }}>
        Your rating: {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
        {item.comment && <span> · "{item.comment}"</span>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {!open ? (
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>⭐ Rate this food</button>
      ) : (
        <div style={{ background: "var(--gray-light)", borderRadius: "var(--radius-sm)", padding: 12, marginTop: 6 }}>
          <div style={{ marginBottom: 8 }}><RatingStars value={rating} onChange={setRating} /></div>
          <input
            className="form-control"
            placeholder="Leave a comment (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ marginBottom: 8, fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Submit"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const { user, API, toast, authHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const LIMIT = 5;

  const fetchOrders = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/orders?email=${user.email}&page=${p}&limit=${LIMIT}`, authHeaders);
      setOrders(data.data || []);
      setTotalPages(data.pages || 1);
      setPage(p);
    } catch { toast("Failed to load orders", "error"); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchOrders(1); }, []);

  const cancelOrder = async (orderId) => {
    try {
      await axios.delete(`${API}/orders/${orderId}?email=${user.email}`, authHeaders);
      toast("Order cancelled. Servings restored.");
      fetchOrders(page);
    } catch (err) { toast(err.response?.data?.message || "Cancel failed", "error"); }
  };

  const handleRated = (orderId, itemIndex, rating, comment) => {
    setOrders(prev => prev.map(o => {
      if (o._id !== orderId) return o;
      const items = o.items.map((item, i) => i === itemIndex ? { ...item, rating, comment } : item);
      return { ...o, items };
    }));
  };

  const allPickedUp = (order) => order.items.every(i => i.pickedUp);

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>My Orders 📦</h1>
          <p>Track all your food orders</p>
        </div>
      </div>

      <div className="container">
        {loading ? <div className="spinner" /> : orders.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>📦</div>
            <h3>No orders yet</h3>
            <p>Browse available food and place your first order</p>
            <Link to="/browse" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Food</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map(order => (
              <div key={order._id} className="card">
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 4 }}>Order ID: {order._id.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize: 13, color: "var(--gray)" }}>{new Date(order.placedAt).toLocaleString()}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="badge badge-success">{order.status}</span>
                      {!allPickedUp(order) && (
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => setConfirmCancel(order._id)}>Cancel</button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ padding: "12px 14px", background: "var(--gray-light)", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 24 }}>🍽</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.foodItem}</div>
                            <div style={{ fontSize: 12, color: "var(--gray)" }}>by {item.donorName}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, color: "var(--primary)" }}>{item.quantity}</div>
                            <div style={{ fontSize: 11, color: "var(--gray)" }}>serving{item.quantity > 1 ? "s" : ""}</div>
                          </div>
                        </div>

                        {/* Donor contact */}
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12 }}>
                          {item.donorEmail && <span style={{ color: "var(--info)" }}>📧 {item.donorEmail}</span>}
                          {item.pickupLocation && <span style={{ color: "var(--gray)" }}>📍 {item.pickupLocation}</span>}
                        </div>

                        {/* Picked up */}
                        <div style={{ marginTop: 8 }}>
                          {item.pickedUp
                            ? <span className="badge badge-success">✓ Picked Up</span>
                            : <button className="btn btn-ghost btn-sm" onClick={async () => {
                                try {
                                  await axios.patch(`${API}/orders/pickup`, { orderId: order._id, itemIndex: i }, authHeaders);
                                  setOrders(prev => prev.map(o => o._id !== order._id ? o : {
                                    ...o, items: o.items.map((it, idx) => idx !== i ? it : { ...it, pickedUp: true })
                                  }));
                                  toast("Marked as picked up!");
                                } catch { toast("Failed to update", "error"); }
                              }}>✓ Mark as Picked Up</button>
                          }
                        </div>

                        {/* Rating */}
                        <RateItem
                          orderId={order._id}
                          itemIndex={i}
                          item={item}
                          API={API}
                          userName={user.name}
                          toast={toast}
                          authHeaders={authHeaders}
                          onRated={(idx, r, c) => handleRated(order._id, idx, r, c)}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--gray)", display: "flex", gap: 16 }}>
                    <span>🍽 {order.items.reduce((s, i) => s + i.quantity, 0)} total servings</span>
                    <span>📦 {order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => fetchOrders(page - 1)}>← Prev</button>
            <span style={{ alignSelf: "center", fontSize: 14, color: "var(--gray)" }}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => fetchOrders(page + 1)}>Next →</button>
          </div>
        )}
      </div>

      {confirmCancel && (
        <ConfirmModal
          title="Cancel Order"
          message="Cancel this order? Servings will be returned to the listing."
          confirmLabel="Cancel Order"
          onConfirm={() => cancelOrder(confirmCancel)}
          onClose={() => setConfirmCancel(null)}
        />
      )}
    </div>
  );
}
