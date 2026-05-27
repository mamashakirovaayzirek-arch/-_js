import React, { useState, useEffect } from 'react';
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
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  useEffect(() => {
    // Синхронизируем язык со всеми страницами
    const handleStorage = () => {
      setLang(localStorage.getItem('lang') || 'ru');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'ru' ? 'ky' : 'ru';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    // Принудительно обновляем все компоненты
    window.dispatchEvent(new Event('langChange'));
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">🍜 OshMenu</Link>
      <div className="nav-links">
        <Link to="/">{lang === 'ru' ? 'Главная' : 'Башкы'}</Link>
        {isAuthenticated ? (
          <>
            {user?.role === 'admin' && <Link to="/admin">🔧 {lang === 'ru' ? 'Админ' : 'Админ'}</Link>}
            {user?.role === 'owner' && <Link to="/owner">{lang === 'ru' ? 'Мой ресторан' : 'Менин рестораным'}</Link>}
            {(user?.role === 'admin' || user?.role === 'owner') && <Link to="/add-dish">+ {lang === 'ru' ? 'Блюдо' : 'Тамак'}</Link>}
            <Link to="/cart">🛒 {lang === 'ru' ? 'Корзина' : 'Себет'}</Link>
            <Link to="/profile">👤 {user?.name}</Link>
            <button onClick={logout} className="btn-logout">{lang === 'ru' ? 'Выйти' : 'Чыгуу'}</button>
          </>
        ) : (
          <>
            <Link to="/login">{lang === 'ru' ? 'Вход' : 'Кирүү'}</Link>
            <Link to="/register">{lang === 'ru' ? 'Регистрация' : 'Катталуу'}</Link>
          </>
        )}
        <button className="lang-toggle-nav" onClick={toggleLang}>
          {lang === 'ru' ? '🇰🇬 Кыргызча' : '🇷🇺 Русский'}
        </button>
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