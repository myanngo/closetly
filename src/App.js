import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Placeholder components (to be implemented)
import HomeFeed from './components/HomeFeed';
import Profile from './components/Profile';
import AddItem from './components/AddItem';
import NavBar from './components/NavBar';
import ItemDetail from './components/ItemDetail';
import ItemHistory from './components/ItemHistory';

function AppRoutes() {
  const location = useLocation();
  const hideNav = /\/item\/\d+(\/history)?$/.test(location.pathname);
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomeFeed />} />
        <Route path="/add" element={<AddItem />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/item/:itemId" element={<ItemDetail />} />
        <Route path="/item/:itemId/history" element={<ItemHistory />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!hideNav && <NavBar />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
