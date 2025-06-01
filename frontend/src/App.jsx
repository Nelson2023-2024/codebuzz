import { useState } from "react";
import { Button } from "./components/ui/button";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import Sidebar from "./components/sidebar/SideBar";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "react-hot-toast";
import GuestPage from "./pages/guests/GuestPage";
import GuestDetailPage from "./pages/guests/GuestDetailsPage";
import EventPage from "./pages/events/EventPage";
import RVPSPage from "./pages/rvps/RSVPsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import EventDetailPage from "./pages/events/EventDetailPage";
import RSVPsPage from "./pages/rvps/RSVPsPage";

// Component to protect admin-only routes
const AdminRoute = ({ children }) => {
  const { authUser } = useAuth();
  
  if (!authUser) {
    return <Navigate to="/login" />;
  }
  
  if (authUser.role !== "admin") {
    // Redirect non-admin users to dashboard with a message
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Component to protect authenticated routes
const ProtectedRoute = ({ children }) => {
  const { authUser } = useAuth();
  
  if (!authUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  // FIX: Destructure 'error' from useAuth
  const { authUser, isLoading, isError, error } = useAuth();
  console.log("authUser:", authUser, "isLoading:", isLoading, "isError:", isError);

  // You might want a simple loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading application...
      </div>
    );
  }

  return (
    <div className="flex h-screen ">
      {authUser && <Sidebar />}

      {/* Main Content - starts after sidebar */}
      <div className="flex-1 overflow-auto ">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          {/* Admin-only routes */}
          <Route
            path="/guests"
            element={
              <AdminRoute>
                <GuestPage />
              </AdminRoute>
            }
          />
          <Route
            path="/guests/:guestId"
            element={
              <AdminRoute>
                <GuestDetailPage />
              </AdminRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <EventDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rvps"
            element={
              <AdminRoute>
                <RSVPsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </div>
    </div>
  );
}

export default App;