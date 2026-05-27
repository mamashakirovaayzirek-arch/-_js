import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AddDish from './pages/AddDish';
import OwnerPanel from './pages/OwnerPanel';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">🍜 OshMenu</Link>
      <div className="nav-links">
        <Link to="/">Главная</Link>
        {isAuthenticated ? (
          <>
            {user?.role === 'admin' && <Link to="/admin">🔧 Админ</Link>}
            {user?.role === 'owner' && <Link to="/owner">Мой ресторан</Link>}
            {(user?.role === 'admin' || user?.role === 'owner') && <Link to="/add-dish">+ Блюдо</Link>}
            <Link to="/cart">🛒 Корзина</Link>
            <Link to="/profile">👤 {user?.name}</Link>
            <button onClick={logout} className="btn-logout">Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<Restaurant />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/add-dish" element={<AddDish />} />
            <Route path="/owner" element={<OwnerPanel />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;