import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import FoodCard from "../../components/FoodCard";
import "./Browse.css";

const CATEGORIES = ["All", "Rice", "Curry", "Breakfast", "Snacks", "Dessert", "Bread", "Soup", "Other"];

export default function Browse() {
  const { addToCart, API } = useAuth();
  const [foods, setFoods] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 9;

  const fetchFoods = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (search) params.search = search;
      if (location) params.location = location;
      if (category !== "All") params.category = category;
      const { data } = await axios.get(`${API}/foods`, { params });
      const list = data.data || data;
      const total = data.pages || 1;
      const sorted = [...list].sort((a, b) => {
        if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sort === "expiring") return new Date(a.createdAt) - new Date(b.createdAt);
        return 0;
      });
      setFoods(sorted);
      setTotalPages(total);
      setPage(p);
      const donorNames = [...new Set(sorted.map(f => f.donorName))];
      if (donorNames.length > 0) {
        try {
          const { data: rData } = await axios.post(`${API}/donor-ratings/batch`, { donorNames });
          setRatings(rData);
        } catch {}
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchFoods(1); }, [category, sort]);

  const handleSearch = (e) => { e.preventDefault(); fetchFoods(1); };

  const clearFilters = () => { setSearch(""); setLocation(""); setCategory("All"); setSort("newest"); };

  const handleAddToCart = (food) => {
    addToCart({
      foodId: food._id,
      foodItem: food.foodItem,
      donorName: food.donorName,
      donorEmail: food.donorEmail,
      pickupLocation: food.pickupLocation,
      category: food.category,
      quantity: 1,
      maxServings: food.servings
    });
  };

  return (
    <div className="browse-page">
      <div className="page-header">
        <div className="container">
          <h1>Browse Available Food 🍽</h1>
          <p>Find freshly prepared food shared by your community</p>
        </div>
      </div>

      <div className="container">
        <div className="browse-controls">
          <form className="search-bar" onSubmit={handleSearch}>
            <input className="form-control" type="text" placeholder="Search for food..." value={search} onChange={e => setSearch(e.target.value)} />
            <input className="form-control" type="text" placeholder="Filter by location..." value={location} onChange={e => setLocation(e.target.value)} style={{ maxWidth: 220 }} />
            <button className="btn btn-primary" type="submit">Search</button>
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div className="category-filters">
              {CATEGORIES.map(cat => (
                <button key={cat} className={`cat-btn ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>{cat}</button>
              ))}
            </div>
            <select className="form-control" style={{ width: "auto", fontSize: 13 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Recently Added</option>
              <option value="expiring">Expiring Soon</option>
            </select>
          </div>
        </div>

        <div className="browse-results-header">
          <span>{foods.length} item{foods.length !== 1 ? "s" : ""} available</span>
          {(search || location || category !== "All") && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters ✕</button>
          )}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : foods.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>🍽</div>
            <h3>No food available</h3>
            <p>Try a different search or check back later</p>
          </div>
        ) : (
          <>
            <div className="food-grid">
              {foods.map(food => (
                <FoodCard key={food._id} food={food} onAddToCart={handleAddToCart} donorRating={ratings[food.donorName]} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => fetchFoods(page - 1)}>← Prev</button>
                <span style={{ alignSelf: "center", fontSize: 14, color: "var(--gray)" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => fetchFoods(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
