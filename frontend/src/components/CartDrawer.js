import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CartDrawer({ onClose }) {
  const { cart, removeFromCart, updateQty, clearCart, user, toast } = useAuth();
  const navigate = useNavigate();
  const touchStartX = useRef(null);

  const totalServings = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    if (!user) { toast("Please login to checkout", "error"); return; }
    onClose();
    navigate("/checkout");
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) onClose(); // swipe right to close
    touchStartX.current = null;
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="cart-header">
          <h3>🛒 Your Cart ({cart.length})</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <h3>Cart is empty</h3>
              <p>Browse available food and add items to your cart</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.foodId} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.foodItem}</h4>
                  <p>by {item.donorName} · {item.category}</p>
                  <div className="cart-qty">
                    <button onClick={() => updateQty(item.foodId, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.foodId, 1)}>+</button>
                    <span style={{ fontSize: 12, color: "var(--gray)", marginLeft: 4 }}>serving{item.quantity > 1 ? "s" : ""}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.foodId)}
                  style={{ background: "none", border: "none", color: "var(--danger)", fontSize: 18, alignSelf: "flex-start", padding: 4 }}
                >🗑</button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Items</span><span>{cart.length}</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total Servings</span><span>{totalServings}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={handleCheckout}>
              Proceed to Checkout →
            </button>
            <button className="btn btn-ghost btn-block mt-1" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
