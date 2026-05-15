import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const { login, toast, API } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/login`, form);
      login(data.user, data.token);
      toast(`Welcome back, ${data.user.name}! 👋`);
      navigate(data.user.role === "Admin" ? "/admin" : "/browse");
    } catch (err) {
      toast(err.response?.data?.message || "Login failed", "error");
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
        <h2>Share food.<br />Spread kindness.</h2>
        <p>Join our community of food sharers and help reduce waste while feeding those in need.</p>
        <div className="auth-features">
          <div>✓ Free to use</div>
          <div>✓ Verified listings</div>
          <div>✓ Easy pickup</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" placeholder="Enter your password" value={form.password} onChange={handle} required />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
            <p style={{ textAlign: "right", marginTop: 8 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--primary)" }}>Forgot password?</Link>
            </p>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
