import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5001";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("l2r_user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("l2r_token") || null);
  const [cart, setCart] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("l2r_user", JSON.stringify(userData));
    localStorage.setItem("l2r_token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCart([]);
    localStorage.removeItem("l2r_user");
    localStorage.removeItem("l2r_token");
  };

  const fetchCart = useCallback(async () => {
    if (!user || user.role === "Admin") return;
    try {
      const [cartRes, foodsRes] = await Promise.all([
        axios.get(`${API}/cart?email=${user.email}`),
        axios.get(`${API}/foods`)
      ]);
      const liveIds = new Set(foodsRes.data.map(f => f._id));
      const liveMap = Object.fromEntries(foodsRes.data.map(f => [f._id, f]));
      const valid = cartRes.data
        .filter(i => liveIds.has(i.foodId))
        .map(i => ({ ...i, maxServings: liveMap[i.foodId].servings }));
      setCart(valid);
    } catch {}
  }, [user]);

  // Poll unread message count every 15s for logged-in non-admin users
  useEffect(() => {
    if (!user || user.role === "Admin" || !token) return;
    const fetchUnread = () =>
      axios.get(`${API}/chat/unread?email=${user.email}`, authHeaders)
        .then(r => setUnreadCount(r.data.count))
        .catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user, token]);

  const markMessagesRead = useCallback(async () => {
    if (!user || !token) return;
    try {
      await axios.post(`${API}/chat/read`, { email: user.email }, authHeaders);
      setUnreadCount(0);
    } catch {}
  }, [user, token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (item) => {
    // check if already in cart and would exceed maxServings
    const existing = cart.find(i => i.foodId === item.foodId);
    if (existing && existing.quantity >= item.maxServings) {
      toast(`Only ${item.maxServings} serving${item.maxServings > 1 ? "s" : ""} available`, "error");
      return;
    }
    try {
      const { data } = await axios.post(`${API}/cart`, { email: user.email, item });
      setCart(data);
      toast(`${item.foodItem} added to cart!`);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to add to cart", "error");
    }
  };

  const removeFromCart = async (foodId) => {
    try {
      const { data } = await axios.delete(`${API}/cart/item`, { data: { email: user.email, foodId } });
      setCart(data);
    } catch {}
  };

  const updateQty = async (foodId, delta) => {
    const item = cart.find(i => i.foodId === foodId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) return removeFromCart(foodId);
    if (newQty > item.maxServings) {
      toast(`Only ${item.maxServings} serving${item.maxServings > 1 ? "s" : ""} available`, "error");
      return;
    }
    const updated = cart.map(i => i.foodId === foodId ? { ...i, quantity: newQty } : i);
    setCart(updated);
    try {
      await axios.post(`${API}/cart`, { email: user.email, item: { ...item, quantity: delta } });
    } catch {}
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart`, { data: { email: user.email } });
      setCart([]);
    } catch {}
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, cart, cartCount, addToCart, removeFromCart, updateQty, clearCart, fetchCart, toast, API, authHeaders, unreadCount, markMessagesRead }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
            {t.message}
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
