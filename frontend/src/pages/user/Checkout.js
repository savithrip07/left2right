import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./Checkout.css";

export default function Checkout() {
  const { user, cart, clearCart, fetchCart, toast, API, authHeaders } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const totalServings = cart.reduce((s, i) => s + i.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return toast("Your cart is empty", "error");
    setLoading(true);
    try {
      await axios.post(`${API}/orders`, { email: user.email, userName: user.name, items: cart }, authHeaders);
      await clearCart();
      toast("Order placed successfully! 🎉");
      navigate("/my-orders");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to place order";
      // if a food was deleted/expired, tell user clearly and refresh cart
      if (msg.includes("Not enough servings") || msg.includes("Food not found")) {
        toast(`${msg}. It may have expired or been claimed. Removing from cart.`, "error");
        await fetchCart();
      } else {
        toast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ paddingBottom: 60 }}>
        <div className="page-header"><div className="container"><h1>Checkout</h1></div></div>
        <div className="container">
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some food items before checking out</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>Checkout 🛒</h1>
          <p>Review your order before confirming</p>
        </div>
      </div>

      <div className="container">
        <div className="checkout-layout">
          <div className="checkout-items">
            <div className="card">
              <div className="card-header"><h3>Order Items ({cart.length})</h3></div>
              <div className="card-body" style={{ padding: 0 }}>
                {cart.map(item => (
                  <div key={item.foodId} className="checkout-item">
                    <div className="checkout-item-emoji">🍽</div>
                    <div className="checkout-item-info">
                      <h4>{item.foodItem}</h4>
                      <p>Donated by {item.donorName} · {item.category}</p>
                    </div>
                    <div className="checkout-item-qty">
                      <span>{item.quantity}</span>
                      <small>serving{item.quantity > 1 ? "s" : ""}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>


          </div>

          <div className="checkout-summary">
            <div className="card">
              <div className="card-header"><h3>Order Summary</h3></div>
              <div className="card-body">
                <div className="summary-row"><span>Items</span><span>{cart.length}</span></div>
                <div className="summary-row"><span>Total Servings</span><span>{totalServings}</span></div>
                <div className="summary-row"><span>Cost</span><span style={{ color: "var(--primary)", fontWeight: 700 }}>FREE 🎉</span></div>
                <div className="summary-divider" />
                <div className="summary-row total"><span>Total</span><span>0 ₹</span></div>

                <div className="pickup-info">
                  <h4>📍 Pickup Info</h4>
                  {cart.map(item => (
                    <div key={item.foodId} className="pickup-item">
                      <strong>{item.foodItem}</strong>
                      {item.pickupLocation && <span>📍 {item.pickupLocation}</span>}
                      {item.donorEmail && <span>📧 {item.donorEmail}</span>}
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary btn-block btn-lg"
                  onClick={placeOrder}
                  disabled={loading}
                  style={{ marginTop: 20 }}
                >
                  {loading ? "Placing Order..." : "Confirm Order ✓"}
                </button>
                <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => navigate("/browse")}>
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
