import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Landing.css";

export default function Landing() {
  const { user, API } = useAuth();
  const [stats, setStats] = useState({ totalServings: 0, totalUsers: 0, totalOrders: 0 });

  useEffect(() => {
    axios.get(`${API}/stats`).then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🌱 Fighting Food Waste Together</div>
          <h1>Share Food.<br />Spread <span>Kindness.</span></h1>
          <p>Left2Right connects people with surplus food to those who need it. Post your leftovers, browse available food, and make a difference in your community — completely free.</p>
          <div className="hero-actions">
            {user ? (
              <>
                <Link to="/browse" className="btn btn-primary btn-lg">Browse Food 🍽</Link>
                <Link to="/donate" className="btn btn-outline btn-lg" style={{ color: "white", borderColor: "white" }}>Donate Food 🤝</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
                <Link to="/login" className="btn btn-outline btn-lg" style={{ color: "white", borderColor: "white" }}>Sign In</Link>
              </>
            )}
          </div>
          <div className="hero-stats">
            <div><strong>{stats.totalServings || 0}+</strong><span>Meals Shared</span></div>
            <div><strong>{stats.totalUsers || 0}+</strong><span>Active Users</span></div>
            <div><strong>{stats.totalOrders || 0}+</strong><span>Orders Placed</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-emoji-grid">
            {["🍛","🥘","🍚","🥗","🍲","🫓","🍮","🥞"].map((e, i) => (
              <div key={i} className="hero-emoji-item" style={{ animationDelay: `${i * 0.1}s` }}>{e}</div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How Left2Right Works</h2>
            <p>Simple steps to share or receive food in your community</p>
          </div>
          <div className="steps-grid">
            {[
              { icon: "📝", step: "01", title: "Create Account", desc: "Sign up for free and join our growing community of food sharers." },
              { icon: "🍽", step: "02", title: "Post or Browse", desc: "Post your leftover food or browse what's available near you." },
              { icon: "🛒", step: "03", title: "Add to Cart", desc: "Select the servings you need and add items to your cart." },
              { icon: "🤝", step: "04", title: "Pick Up & Enjoy", desc: "Coordinate pickup with the donor and enjoy your meal!" }
            ].map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{s.step}</div>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-text">
              <h2>Everything you need to share food</h2>
              <div className="feature-list">
                {[
                  { icon: "🛒", title: "Smart Cart System", desc: "Add multiple food items, manage servings, and checkout in one go." },
                  { icon: "🔍", title: "Search & Filter", desc: "Find food by category, name, or availability instantly." },
                  { icon: "📦", title: "Order Tracking", desc: "Track all your orders and donation history in one place." },
                  { icon: "🛡", title: "Admin Moderation", desc: "All listings are reviewed to ensure quality and safety." }
                ].map((f, i) => (
                  <div key={i} className="feature-item">
                    <span className="feature-icon">{f.icon}</span>
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2>Ready to make a difference?</h2>
          <p>Join hundreds of people already sharing food in their communities</p>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-lg">Join Left2Right Today →</Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-brand">
            <span>🍃</span> <strong>Left2Right</strong>
          </div>
          <p>Reducing food waste, one meal at a time.</p>
          <p style={{ marginTop: 8, fontSize: 12 }}>© 2025 Left2Right. Made with ❤️ for the community.</p>
        </div>
      </footer>
    </div>
  );
}
