import { useState } from "react";
import { Button } from "./components/ui/button";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import Sidebar from "./components/sidebar/SideBar";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "react-hot-toast";

function App() {
  const { authUser, isLoading, isError } = useAuth(); // Destructure isLoading and isError
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
  // You might want to show a general error message or redirect to a more specific error page.
  if (isError) {
      // You could also render the login page directly here or a specific error page
      console.error("Error fetching auth user:", error); // Make sure 'error' is destructured from useAuth
      // If you want to force a redirect to login on persistent error:
      return <Navigate to="/login" replace />;
      // Or show an error message on the screen:
      // return (
      //   <div className="flex items-center justify-center h-screen text-red-500">
      //     Failed to load application data. Please try again.
      //   </div>
      // );
  }

  return (
    <div className="flex h-screen ">
      {authUser && <Sidebar />}

      {/* Main Content - starts after sidebar */}
      <div className="flex-1 overflow-auto ">
        <Routes>
          <Route
            path="/"
            // If authUser is present, go to HomePage, otherwise navigate to login
            element={authUser ? <HomePage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/login"
            // If authUser is NOT present, stay on LoginPage, otherwise navigate to home
            element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}
          />
        </Routes>
        <Toaster />
      </div>
    </div>
  );
}

export default App;