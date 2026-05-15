import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const { toast, API } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast("Passwords do not match", "error");
    if (form.password.length < 6) return toast("Password must be at least 6 characters", "error");
    setLoading(true);
    try {
      await axios.post(`${API}/register`, { name: form.name, email: form.email, password: form.password });
      toast("Account created! Please sign in 🎉");
      navigate("/login");
    } catch (err) {
      toast(err.response?.data?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span>🍃</span>
          <h1>Left<span>2</span>Right</h1>
        </div>
        <h2>Start sharing<br />food today.</h2>
        <p>Create your free account and become part of a community that cares about reducing food waste.</p>
        <div className="auth-features">
          <div>✓ Post unlimited listings</div>
          <div>✓ Browse & order food</div>
          <div>✓ Track your impact</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p>Join the Left2Right community</p>
          </div>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" type="text" name="name" placeholder="Your full name" value={form.name} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" name="confirm" placeholder="Repeat your password" value={form.confirm} onChange={handle} required />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
