import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

// Components
import HomeFeed from "./components/HomeFeed";
import Profile from "./components/Profile";
import AddItem from "./components/AddItem";
import NavBar from "./components/NavBar";
import ItemDetail from "./components/ItemDetail";
import ItemHistory from "./components/ItemHistory";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import Verify from "./components/Verify";
import CompleteProfile from "./components/CompleteProfile";
import SwapOffer from "./components/SwapOffer";
import { AuthProvider } from "./context/AuthContext";

function AppRoutes() {
  const location = useLocation();
  const hideNav =
    /\/item\/\d+(\/history)?$/.test(location.pathname) ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/verify" ||
    location.pathname === "/complete-profile";

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddItem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/item/:itemId"
          element={
            <ProtectedRoute>
              <ItemDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/item/:itemId/history"
          element={
            <ProtectedRoute>
              <ItemHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/item/:itemId/offer-swap"
          element={
            <ProtectedRoute>
              <SwapOffer />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!hideNav && <NavBar />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
