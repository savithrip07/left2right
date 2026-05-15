import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function Chat() {
  const { user, API, toast, authHeaders } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const food = location.state?.food;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!food) return;
    const load = () =>
      axios.get(`${API}/chat?foodId=${food._id}&userEmail=${user.email}`, authHeaders)
        .then(r => setMessages(r.data))
        .catch(() => {});
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [food]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!food) {
    return (
      <div style={{ paddingBottom: 60 }}>
        <div className="page-header"><div className="container"><h1>Chat 💬</h1></div></div>
        <div className="container">
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>💬</div>
            <h3>No conversation selected</h3>
            <p>Open a chat from a food listing</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/browse")}>Browse Food</button>
          </div>
        </div>
      </div>
    );
  }

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await axios.post(`${API}/chat`, {
        foodId: food._id,
        foodItem: food.foodItem,
        donorEmail: food.donorEmail,
        donorName: food.donorName,
        senderEmail: user.email,
        senderName: user.name,
        message: text.trim()
      }, authHeaders);
      setMessages(m => [...m, data]);
      setText("");
    } catch { toast("Failed to send message", "error"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="btn btn-ghost btn-sm" style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => navigate(-1)}>← Back</button>
          <div>
            <h1 style={{ fontSize: 22 }}>💬 Chat with {food.donorName}</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>About: {food.foodItem}</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 700 }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
          {/* info bar */}
          <div style={{ padding: "12px 20px", background: "var(--gray-light)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--gray)" }}>
            📍 {food.pickupLocation || "Location not specified"} · 📧 {food.donorEmail}
          </div>

          {/* messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--gray)", fontSize: 14, marginTop: 40 }}>
                No messages yet. Ask the donor about pickup time, location, or anything else!
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.from === user.email;
              return (
                <div key={msg._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "70%", padding: "10px 14px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isMe ? "var(--primary)" : "var(--gray-light)",
                    color: isMe ? "white" : "#333",
                    fontSize: 14, lineHeight: 1.5
                  }}>
                    {!isMe && <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--primary)" }}>{msg.fromName}</div>}
                    <div>{msg.message}</div>
                    <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7, textAlign: "right" }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* input */}
          <form onSubmit={send} style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
            <input
              className="form-control"
              placeholder="Ask about pickup time, location, food details..."
              value={text}
              onChange={e => setText(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={sending || !text.trim()}>
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
