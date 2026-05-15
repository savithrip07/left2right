import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🍽</div>
        <h1 style={{ fontSize: 72, fontWeight: 800, color: "var(--primary)", lineHeight: 1, marginBottom: 8 }}>404</h1>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "#1a1a2e" }}>Page Not Found</h2>
        <p style={{ color: "var(--gray)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          Looks like this page went missing — just like leftover food that nobody claimed in time.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
          <Link to={user ? (user.role === "Admin" ? "/admin" : "/browse") : "/"} className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
