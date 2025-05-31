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

  // Handle a persistent error (e.g., if the /me endpoint always fails)
  if (isError) {
    console.error("Error fetching auth user:", error);
    // If you want to force a redirect to login on persistent error:
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen ">
      {authUser && <Sidebar />}

      {/* Main Content - starts after sidebar */}
      <div className="flex-1 overflow-auto ">
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/guests"
            element={authUser ? <GuestPage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/guests/:guestId"
            element={authUser ? <GuestDetailPage /> : <Navigate to={"/login"} />}
          />
        </Routes>
        <Toaster />
      </div>
    </div>
  );
}

export default App;