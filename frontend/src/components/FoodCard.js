import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./FoodCard.css";

function ExpiryCountdown({ createdAt }) {
  const getRemaining = () => {
    const diff = new Date(createdAt).getTime() + 2 * 60 * 60 * 1000 - Date.now();
    return diff > 0 ? diff : 0;
  };
  const [remaining, setRemaining] = useState(getRemaining);
  useEffect(() => {
    const t = setInterval(() => setRemaining(getRemaining()), 30000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt]);

  if (remaining === 0) return <span className="expiry-badge expiry-expired">Expired</span>;
  const mins = Math.floor(remaining / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <span className={`expiry-badge ${remaining < 30 * 60000 ? "expiry-urgent" : "expiry-ok"}`}>
      ⏱ {hrs > 0 ? `${hrs}h ${m}m` : `${m}m`} left
    </span>
  );
}

function DonorRating({ rating }) {
  if (!rating || !rating.avg) return null;
  return (
    <span className="donor-rating">
      {"★".repeat(Math.round(rating.avg))}{"☆".repeat(5 - Math.round(rating.avg))} {rating.avg} ({rating.count})
    </span>
  );
}

function ReportModal({ food, onClose, API, user, toast, authHeaders }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return toast("Please describe the issue", "error");
    setLoading(true);
    try {
      await axios.post(`${API}/reports`, { foodId: food._id, foodItem: food.foodItem, donorName: food.donorName, reason, reporterName: user.name }, authHeaders);
      toast("Report submitted. Admin will review it.");
      onClose();
    } catch { toast("Failed to submit report", "error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Listing</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: 14 }}>
            Reporting: <strong>{food.foodItem}</strong> by {food.donorName}
          </p>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-control" rows={3} placeholder="e.g. Food looks spoilt, fake listing, wrong info..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={submit} disabled={loading}>{loading ? "Submitting..." : "Submit Report"}</button>
        </div>
      </div>
    </div>
  );
}

export default function FoodCard({ food, onAddToCart, donorRating }) {
  const { user, API, toast, authHeaders } = useAuth();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="food-card">
      <div className="food-card-body">
        <div className="food-card-top">
          <span className="badge badge-info">{food.category}</span>
          {food.inStock && food.servings > 0
            ? <span className="badge badge-success">Available</span>
            : <span className="badge badge-danger">Out of Stock</span>
          }
          {food.createdAt && <ExpiryCountdown createdAt={food.createdAt} />}
        </div>

        <h3 className="food-card-title">{food.foodItem}</h3>
        <p className="food-card-desc">{food.description || "Freshly prepared homemade food"}</p>

        {food.allergens && (
          <div className="food-card-allergens">⚠ <strong>Allergens:</strong> {food.allergens}</div>
        )}

        <div className="food-card-meta">
          <span>👤 {food.donorName}</span>
          <span>🍽 {food.servings} serving{food.servings !== 1 ? "s" : ""}</span>
        </div>

        <DonorRating rating={donorRating} />

        {food.pickupLocation && (
          <div className="food-card-location">📍 {food.pickupLocation}</div>
        )}

        <button className="contact-toggle" onClick={() => setShowContact(v => !v)}>
          📞 {showContact ? "Hide Contact" : "Show Donor Contact"}
        </button>

        {showContact && (
          <div className="food-card-contact">
            <span>📧 {food.donorEmail}</span>
            {food.contactNumber && <span>📞 {food.contactNumber}</span>}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {user && user.role !== "Admin" && (
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!food.inStock || food.servings === 0}
              onClick={() => onAddToCart(food)}
            >
              {food.inStock && food.servings > 0 ? "Add to Cart 🛒" : "Out of Stock"}
            </button>
          )}
          {user && user.role !== "Admin" && user.email !== food.donorEmail && (
            <button
              className="btn btn-ghost btn-sm"
              title="Chat with donor"
              onClick={() => navigate("/chat", { state: { food } })}
            >💬</button>
          )}
          {user && user.role !== "Admin" && (
            <button className="btn btn-ghost btn-sm report-btn" onClick={() => setShowReport(true)} title="Report this listing">🚩</button>
          )}
        </div>
      </div>

      {showReport && <ReportModal food={food} onClose={() => setShowReport(false)} API={API} user={user} toast={toast} authHeaders={authHeaders} />}
    </div>
  );
}
