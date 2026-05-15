import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function ForgotPassword() {
  const { API, toast } = useAuth();
  const [step, setStep] = useState(1); // 1=email, 2=code+newpass
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetCode, setResetCode] = useState(""); // shown for demo

  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/forgot-password`, { email });
      setResetCode(data.code || null); // only set in dev mode
      toast(data.code ? "Reset code generated!" : "Reset code sent to your email!");
      setStep(2);
    } catch (err) {
      toast(err.response?.data?.message || "Email not found", "error");
    } finally { setLoading(false); }
  };

  const resetPass = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast("Passwords don't match", "error");
    if (newPassword.length < 6) return toast("Password must be at least 6 characters", "error");
    setLoading(true);
    try {
      await axios.post(`${API}/reset-password`, { email, code, newPassword });
      toast("Password reset successfully! Please sign in.");
      setStep(3);
    } catch (err) {
      toast(err.response?.data?.message || "Reset failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand"><span>🍃</span><h1>Left<span>2</span>Right</h1></div>
        <h2>Reset your<br />password.</h2>
        <p>Enter your email to receive a reset code and set a new password.</p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {step === 1 && (
            <>
              <div className="auth-card-header">
                <h2>Forgot Password</h2>
                <p>We'll send a reset code to your email</p>
              </div>
              <form onSubmit={requestCode}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Get Reset Code →"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-card-header">
                <h2>Enter Reset Code</h2>
                <p>{resetCode ? "Dev mode — code shown below" : "Check your email for the 6-digit code"}</p>
              </div>
              {resetCode && (
                <div style={{ background: "var(--primary-light)", border: "1px solid var(--primary)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                  Demo mode — your code is: <strong style={{ fontSize: 18, letterSpacing: 2 }}>{resetCode}</strong>
                </div>
              )}
              <form onSubmit={resetPass}>
                <div className="form-group">
                  <label className="form-label">Reset Code</label>
                  <input className="form-control" placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-control" type="password" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-control" type="password" placeholder="Repeat new password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password →"}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ marginBottom: 8 }}>Password Reset!</h2>
              <p style={{ color: "var(--gray)", marginBottom: 24 }}>Your password has been updated successfully.</p>
              <Link to="/login" className="btn btn-primary btn-lg">Sign In Now →</Link>
            </div>
          )}

          {step !== 3 && (
            <p className="auth-footer-text" style={{ marginTop: 16 }}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
