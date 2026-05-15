import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./Donate.css";

const CATEGORIES = ["Rice", "Curry", "Breakfast", "Snacks", "Dessert", "Bread", "Soup", "Other"];

export default function Donate() {
  const { user, toast, API, authHeaders } = useAuth();
  const [form, setForm] = useState({
    foodItem: "", description: "", allergens: "", category: "Rice",
    servings: "", pickupLocation: "", contactNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.foodItem || !form.servings || !form.pickupLocation || !form.contactNumber) {
      return toast("Please fill all required fields", "error");
    }
    setLoading(true);
    try {
      await axios.post(`${API}/foods`, {
        ...form,
        donorName: user.name,
        donorEmail: user.email,
        servings: parseInt(form.servings)
      }, authHeaders);
      toast("Food posted! Awaiting admin approval 🎉");
      setSubmitted(true);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to post food", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="donate-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">🎉</div>
            <h2>Food Posted Successfully!</h2>
            <p>Your listing is under review. Once approved by our admin, it will appear in the browse section for others to claim.</p>
            <div className="success-info">
              <div><strong>Food Item:</strong> {form.foodItem}</div>
              <div><strong>Servings:</strong> {form.servings}</div>
              <div><strong>Pickup:</strong> {form.pickupLocation}</div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => { setSubmitted(false); setForm({ foodItem: "", description: "", allergens: "", category: "Rice", servings: "", pickupLocation: "", contactNumber: "" }); }}>
              Post Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="donate-page">
      <div className="page-header">
        <div className="container">
          <h1>Donate Food 🤝</h1>
          <p>Share your surplus food with the community</p>
        </div>
      </div>

      <div className="container">
        <div className="donate-layout">
          <div className="donate-form-wrap">
            <div className="card">
              <div className="card-header">
                <h3>Food Listing Details</h3>
              </div>
              <div className="card-body">
                <form onSubmit={submit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Food Item Name *</label>
                      <input className="form-control" name="foodItem" placeholder="e.g. Vegetable Biryani" value={form.foodItem} onChange={handle} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select className="form-control" name="category" value={form.category} onChange={handle}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" name="description" placeholder="Describe the food, ingredients, or any notes..." value={form.description} onChange={handle} rows={3} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Allergens</label>
                    <input className="form-control" name="allergens" placeholder="e.g. Nuts, Dairy, Gluten — leave blank if none" value={form.allergens} onChange={handle} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Number of Servings *</label>
                    <input className="form-control" type="number" name="servings" placeholder="e.g. 5" min="1" value={form.servings} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input className="form-control" name="contactNumber" placeholder="e.g. +91 98765 43210" value={form.contactNumber} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pickup Location *</label>
                    <input className="form-control" name="pickupLocation" placeholder="e.g. 12 MG Road, Bangalore" value={form.pickupLocation} onChange={handle} required />
                  </div>

                  <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                    {loading ? "Posting..." : "Post Food Listing 🍽"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="donate-tips">
            <div className="card">
              <div className="card-body">
                <h4>📋 Posting Guidelines</h4>
                <ul>
                  <li>Food must be freshly prepared and safe to eat</li>
                  <li>Fill in the allergens field if the food contains common allergens</li>
                  <li>Listings are reviewed before going live</li>
                  <li>Keep servings count accurate</li>
                </ul>
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-body">
                <h4>🌱 Your Impact</h4>
                <p style={{ fontSize: 14, color: "var(--gray)", marginTop: 8, lineHeight: 1.6 }}>
                  Every meal shared reduces food waste and helps someone in need. Thank you for being part of the Left2Right community!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
