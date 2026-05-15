import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

import Browse from "./pages/user/Browse";
import Donate from "./pages/user/Donate";
import MyListings from "./pages/user/MyListings";
import MyOrders from "./pages/user/MyOrders";
import Checkout from "./pages/user/Checkout";
import Profile from "./pages/user/Profile";
import Chat from "./pages/user/Chat";
import DonorChat from "./pages/user/DonorChat";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFoods from "./pages/admin/AdminFoods";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminReports from "./pages/admin/AdminReports";
import AdminProfile from "./pages/admin/AdminProfile";

// Redirect logged-in users away from public-only pages
function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "Admin" ? "/admin" : "/browse"} replace />;
  return children;
}

// Require login + optional role check
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/not-found" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public only — redirect if already logged in */}
        <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

        {/* User routes */}
        <Route path="/browse" element={<ProtectedRoute role="User"><Browse /></ProtectedRoute>} />
        <Route path="/donate" element={<ProtectedRoute role="User"><Donate /></ProtectedRoute>} />
        <Route path="/my-listings" element={<ProtectedRoute role="User"><MyListings /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute role="User"><MyOrders /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute role="User"><Checkout /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role="User"><Profile /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute role="User"><Chat /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute role="User"><DonorChat /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/foods" element={<ProtectedRoute role="Admin"><AdminFoods /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="Admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute role="Admin"><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/activity" element={<ProtectedRoute role="Admin"><AdminActivity /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="Admin"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute role="Admin"><AdminProfile /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
