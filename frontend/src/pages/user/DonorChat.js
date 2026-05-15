import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function DonorChat() {
  const { user, API, toast, markMessagesRead, authHeaders } = useAuth();
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadThreads = () =>
    axios.get(`${API}/chat/threads?donorEmail=${user.email}`, authHeaders)
      .then(r => {
        setThreads(r.data);
        if (active) {
          const updated = r.data.find(t => t.foodId === active.foodId && t.userEmail === active.userEmail);
          if (updated) setActive(updated);
        }
      }).catch(() => {});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    markMessagesRead();
    loadThreads();
    const interval = setInterval(loadThreads, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  const reply = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      await axios.post(`${API}/chat/reply`, {
        foodId: active.foodId,
        foodItem: active.foodItem,
        donorEmail: user.email,
        donorName: user.name,
        recipientEmail: active.userEmail,
        message: text.trim()
      });
      setText("");
      loadThreads();
    } catch { toast("Failed to send", "error"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>Messages 💬</h1>
          <p>Conversations from people interested in your food</p>
        </div>
      </div>

      <div className="container">
        {threads.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>💬</div>
            <h3>No messages yet</h3>
            <p>When someone messages you about your food, it will appear here</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
            {/* thread list */}
            <div className="card" style={{ overflow: "hidden" }}>
              {threads.map((t, i) => {
                const last = t.messages[t.messages.length - 1];
                const isActive = active?.foodId === t.foodId && active?.userEmail === t.userEmail;
                return (
                  <div
                    key={i}
                    onClick={() => setActive(t)}
                    style={{
                      padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)",
                      background: isActive ? "var(--primary-light)" : "white",
                      borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent"
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.userEmail.split("@")[0]}</div>
                    <div style={{ fontSize: 12, color: "var(--primary)", marginBottom: 4 }}>re: {t.foodItem}</div>
                    {last && <div style={{ fontSize: 12, color: "var(--gray)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last.message}</div>}
                  </div>
                );
              })}
            </div>

            {/* active thread */}
            {active ? (
              <div className="card" style={{ display: "flex", flexDirection: "column", height: "65vh" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700 }}>{active.userEmail}</div>
                  <div style={{ fontSize: 13, color: "var(--gray)" }}>About: {active.foodItem}</div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {active.messages.map(msg => {
                    const isMe = msg.from === user.email;
                    return (
                      <div key={msg._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                        <div style={{
                          maxWidth: "70%", padding: "10px 14px",
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isMe ? "var(--primary)" : "var(--gray-light)",
                          color: isMe ? "white" : "#333", fontSize: 14, lineHeight: 1.5
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

                <form onSubmit={reply} style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
                  <input
                    className="form-control"
                    placeholder="Reply..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit" disabled={sending || !text.trim()}>
                    {sending ? "..." : "Send"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "65vh" }}>
                <div style={{ textAlign: "center", color: "var(--gray)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p>Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
