import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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

// Компонент загрузки
const LoadingScreen = () => (
  <div className="loading-screen" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#ff6b35'
  }}>
    <div className="spinner" style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #ff6b35',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '15px'
    }}></div>
    Загрузка...
  </div>
);

// Защищённый маршрут для админа
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Ждём загрузки данных пользователя
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Защищённый маршрут для владельца
const OwnerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'ru'; } catch(e) { return 'ru'; }
  });

  useEffect(() => {
    const handleStorage = () => {
      try { setLang(localStorage.getItem('lang') || 'ru'); } catch(e) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'ru' ? 'ky' : 'ru';
    setLang(newLang);
    try { localStorage.setItem('lang', newLang); } catch(e) {}
    window.dispatchEvent(new Event('langChange'));
  };

  const getDisplayName = () => {
    if (!user) return '';
    if (user.name && user.name !== 'admin') return user.name;
    if (user.role === 'admin') return lang === 'ru' ? 'Админ' : 'Админ';
    return user.email?.split('@')[0] || 'User';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">🍜 OshMenu</Link>
      <div className="nav-links">
        <Link to="/">{lang === 'ru' ? 'Главная' : 'Башкы'}</Link>
        {isAuthenticated ? (
          <>
            {user?.role === 'admin' && (
              <Link to="/admin">🔧 {lang === 'ru' ? 'Админ' : 'Админ'}</Link>
            )}
            {user?.role === 'owner' && (
              <Link to="/owner">
                {lang === 'ru' ? 'Мой ресторан' : 'Менин рестораным'}
              </Link>
            )}
            {(user?.role === 'admin' || user?.role === 'owner') && (
              <Link to="/add-dish">+ {lang === 'ru' ? 'Блюдо' : 'Тамак'}</Link>
            )}
            <Link to="/cart">🛒 {lang === 'ru' ? 'Корзина' : 'Себет'}</Link>
            <Link to="/profile">👤 {getDisplayName()}</Link>
            <button onClick={logout} className="btn-logout">
              {lang === 'ru' ? 'Выйти' : 'Чыгуу'}
            </button>
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
            <Route path="/add-dish" element={<OwnerRoute><AddDish /></OwnerRoute>} />
            <Route path="/edit-dish/:id" element={<OwnerRoute><AddDish /></OwnerRoute>} />
            <Route path="/owner" element={<OwnerRoute><OwnerPanel /></OwnerRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;