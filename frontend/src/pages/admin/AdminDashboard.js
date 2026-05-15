import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { API, authHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    axios.get(`${API}/stats`, authHeaders).then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "#3498db", link: "/admin/users" },
    { label: "Total Foods", value: stats.totalFoods, icon: "🍽", color: "#2ecc71", link: "/admin/foods" },
    { label: "Pending Approval", value: stats.pendingFoods, icon: "⏳", color: "#f39c12", link: "/admin/foods" },
    { label: "Total Orders", value: stats.totalOrders, icon: "📦", color: "#9b59b6", link: "/admin/orders" },
  ];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div className="container">
          <h1>Admin Dashboard 🛡</h1>
          <p>Overview of Left2Right platform activity</p>
        </div>
      </div>

      <div className="container">
        {/* Stat Cards */}
        <div className="stats-grid">
          {cards.map((c, i) => (
            <Link to={c.link} key={i} className="stat-card" style={{ "--accent": c.color }}>
              <div className="stat-icon">{c.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
              <div className="stat-arrow">→</div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <Link to="/admin/orders" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {stats.recentOrders.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--gray)", fontSize: 14 }}>No orders yet</div>
              ) : stats.recentOrders.map(o => (
                <div key={o._id} className="recent-order-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.userName}</div>
                    <div style={{ fontSize: 12, color: "var(--gray)" }}>{o.items.length} item(s) · {new Date(o.placedAt).toLocaleDateString()}</div>
                  </div>
                  <span className="badge badge-success">{o.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Platform Overview</h3></div>
            <div className="card-body">
              <div className="overview-item">
                <span>Approved Foods</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats.totalFoods ? (stats.approvedFoods / stats.totalFoods) * 100 : 0}%`, background: "var(--primary)" }} />
                </div>
                <span>{stats.approvedFoods}/{stats.totalFoods}</span>
              </div>
              <div className="overview-item">
                <span>Pending Review</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats.totalFoods ? (stats.pendingFoods / stats.totalFoods) * 100 : 0}%`, background: "var(--secondary)" }} />
                </div>
                <span>{stats.pendingFoods}/{stats.totalFoods}</span>
              </div>

              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                <Link to="/admin/foods" className="btn btn-primary btn-block">Manage Food Listings</Link>
                <Link to="/admin/users" className="btn btn-ghost btn-block">Manage Users</Link>
                <Link to="/admin/activity" className="btn btn-ghost btn-block">View Activity Log</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
