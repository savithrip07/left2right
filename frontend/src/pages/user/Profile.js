import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user, login, token, toast, API, authHeaders } = useAuth();
  const [form, setForm] = useState({ name: user.name, newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("profile");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirm) return toast("Passwords don't match", "error");
    if (form.newPassword && form.newPassword.length < 6) return toast("Password must be at least 6 characters", "error");
    setLoading(true);
    try {
      const { data } = await axios.put(`${API}/profile`, {
        email: user.email,
        name: form.name,
        newPassword: form.newPassword || undefined
      }, authHeaders);
      login(data, token);
      toast("Profile updated successfully!");
      setForm(f => ({ ...f, newPassword: "", confirm: "" }));
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>My Profile 👤</h1>
          <p>Manage your account settings</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 700 }}>
        <div className="card">
          <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 20, borderBottom: "1px solid var(--border)", paddingBottom: 24, marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</h2>
              <p style={{ color: "var(--gray)", fontSize: 14 }}>{user.email}</p>
              <span className="badge badge-info" style={{ marginTop: 6 }}>{user.role}</span>
            </div>
          </div>

          <div className="card-body" style={{ paddingTop: 0 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {["profile", "security"].map(t => (
                <button key={t} className={`btn ${tab === t ? "btn-primary" : "btn-ghost"} btn-sm`} onClick={() => setTab(t)}>
                  {t === "profile" ? "👤 Profile Info" : "🔒 Security"}
                </button>
              ))}
            </div>

            <form onSubmit={saveProfile}>
              {tab === "profile" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" name="name" value={form.name} onChange={handle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-control" value={user.email} disabled style={{ background: "#f8f9fa", color: "var(--gray)" }} />
                  </div>
                </>
              )}

              {tab === "security" && (
                <>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input className="form-control" type="password" name="newPassword" placeholder="Leave blank to keep current" value={form.newPassword} onChange={handle} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-control" type="password" name="confirm" placeholder="Repeat new password" value={form.confirm} onChange={handle} />
                  </div>
                </>
              )}

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
