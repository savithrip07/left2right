import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const LIMIT = 10;

export default function AdminOrders() {
  const { API, authHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/orders/all?page=${p}&limit=${LIMIT}`, authHeaders);
      setOrders(data.data || data);
      setTotalPages(data.pages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchOrders(1); }, []);

  const filtered = orders.filter(o =>
    o.userName?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div className="container">
          <h1>All Orders 📦</h1>
          <p>View all orders placed on the platform</p>
        </div>
      </div>

      <div className="container">
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <input
            className="form-control"
            style={{ maxWidth: 320 }}
            placeholder="Search by user name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: 14, color: "var(--gray)" }}>{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>📦</div>
            <h3>No orders yet</h3>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map(order => (
                <div key={order._id} className="card">
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{order.userName}</div>
                        <div style={{ fontSize: 13, color: "var(--gray)" }}>{order.email}</div>
                        <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>
                          {new Date(order.placedAt).toLocaleString()} · ID: {order._id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                      <span className="badge badge-success">{order.status}</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ background: "var(--gray-light)", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontSize: 13 }}>
                          🍽 <strong>{item.foodItem}</strong> × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => fetchOrders(page - 1)}>← Prev</button>
                <span style={{ alignSelf: "center", fontSize: 14, color: "var(--gray)" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => fetchOrders(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
