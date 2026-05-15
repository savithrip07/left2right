import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./CartDrawer";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout, cartCount, unreadCount, markMessagesRead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">🍃</span>
            <span className="brand-text">Left<span>2</span>Right</span>
          </Link>

          {user && (
            <div className={`navbar-links ${menuOpen ? "mobile-open" : ""}`}>
              {user.role === "Admin" ? (
                <>
                  <Link to="/admin" className={isActive("/admin") ? "active" : ""} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <Link to="/admin/foods" className={isActive("/admin/foods") ? "active" : ""} onClick={() => setMenuOpen(false)}>Foods</Link>
                  <Link to="/admin/users" className={isActive("/admin/users") ? "active" : ""} onClick={() => setMenuOpen(false)}>Users</Link>
                  <Link to="/admin/orders" className={isActive("/admin/orders") ? "active" : ""} onClick={() => setMenuOpen(false)}>Orders</Link>
                  <Link to="/admin/activity" className={isActive("/admin/activity") ? "active" : ""} onClick={() => setMenuOpen(false)}>Activity</Link>
                  <Link to="/admin/reports" className={isActive("/admin/reports") ? "active" : ""} onClick={() => setMenuOpen(false)}>Reports</Link>
                </>
              ) : (
                <>
                  <Link to="/browse" className={isActive("/browse") ? "active" : ""} onClick={() => setMenuOpen(false)}>Browse</Link>
                  <Link to="/donate" className={isActive("/donate") ? "active" : ""} onClick={() => setMenuOpen(false)}>Donate</Link>
                  <Link to="/my-listings" className={isActive("/my-listings") ? "active" : ""} onClick={() => setMenuOpen(false)}>My Listings</Link>
                  <Link to="/my-orders" className={isActive("/my-orders") ? "active" : ""} onClick={() => setMenuOpen(false)}>My Orders</Link>
                  <Link to="/messages" className={isActive("/messages") ? "active" : ""} onClick={() => { setMenuOpen(false); markMessagesRead(); }} style={{ position: "relative" }}>
                    Messages
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute", top: -4, right: -4,
                        background: "var(--danger)", color: "white",
                        fontSize: 10, fontWeight: 700,
                        width: 16, height: 16, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                    )}
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="navbar-actions">
            {user && user.role !== "Admin" && (
              <button className="cart-btn" onClick={() => setCartOpen(true)}>
                🛒
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            )}

            {user ? (
              <div className="user-menu">
                <button className="user-avatar" onClick={() => setMenuOpen(!menuOpen)}>
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to={user.role === "Admin" ? "/admin/profile" : "/profile"} onClick={() => setMenuOpen(false)}>
                      👤 Profile
                    </Link>
                    <button onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-btns">
                <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </div>
            )}

            {user && (
              <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                {menuOpen ? "✕" : "☰"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
}
