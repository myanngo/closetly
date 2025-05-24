import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Components
import HomeFeed from './components/HomeFeed';
import Profile from './components/Profile';
import AddItem from './components/AddItem';
import NavBar from './components/NavBar';
import ItemDetail from './components/ItemDetail';
import ItemHistory from './components/ItemHistory';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function AppRoutes() {
  const location = useLocation();
  const hideNav = /\/item\/\d+(\/history)?$/.test(location.pathname) || 
                 location.pathname === '/login' || 
                 location.pathname === '/signup';

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
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
