import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
import './App.css';

const API_URL = 'http://localhost:3001/api';

// Навигация с учётом авторизации и ролей
const Navigation = () => {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <nav className="navbar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 30px',
            background: '#ff6b35',
            color: 'white'
        }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 'bold' }}>
                🍜 OshMenu
            </Link>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Главная</Link>
                {isAuthenticated ? (
                    <>
                        {user?.role === 'owner' && (
                            <Link to="/owner" style={{ color: 'white', textDecoration: 'none' }}>Мой ресторан</Link>
                        )}
                        {(user?.role === 'admin' || user?.role === 'owner') && (
                            <Link to="/add-dish" style={{ color: 'white', textDecoration: 'none' }}>+ Блюдо</Link>
                        )}
                        <Link to="/cart" style={{ color: 'white', textDecoration: 'none' }}>🛒 Корзина</Link>
                        <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>👤 {user?.name}</Link>
                        <button 
                            onClick={logout}
                            style={{
                                background: 'white',
                                color: '#ff6b35',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Выйти
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Вход</Link>
                        <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Регистрация</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

function App() {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('oshmenu_cart');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('oshmenu_darkmode');
        return saved ? JSON.parse(saved) : false;
    });
    
    const [userPhone, setUserPhone] = useState(() => {
        return localStorage.getItem('oshmenu_phone') || '';
    });
    
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        localStorage.setItem('oshmenu_cart', JSON.stringify(cart));
    }, [cart]);
    
    useEffect(() => {
        localStorage.setItem('oshmenu_darkmode', JSON.stringify(darkMode));
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [darkMode]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2000);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        showNotification(darkMode ? '☀️ Дневной режим' : '🌙 Ночной режим');
    };

    const addToCart = (item, restaurantId, restaurantName) => {
        setCart(prev => {
            const existing = prev.find(i => 
                i.id === item.id && i.restaurantId === restaurantId
            );
            
            if (existing) {
                showNotification(`${item.name} +1`);
                return prev.map(i => 
                    i.id === item.id && i.restaurantId === restaurantId
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            
            showNotification(`${item.name} добавлено`);
            return [...prev, { 
                ...item, 
                quantity: 1, 
                restaurantId, 
                restaurantName 
            }];
        });
    };

    const updateQuantity = (itemId, restaurantId, delta) => {
        setCart(prev => {
            const item = prev.find(i => i.id === itemId && i.restaurantId === restaurantId);
            if (!item) return prev;
            
            const newQty = item.quantity + delta;
            
            if (newQty <= 0) {
                showNotification(`${item.name} удалено`);
                return prev.filter(i => !(i.id === itemId && i.restaurantId === restaurantId));
            }
            
            showNotification(`${item.name} ${delta > 0 ? '+1' : '-1'}`);
            return prev.map(i => 
                i.id === itemId && i.restaurantId === restaurantId
                    ? { ...i, quantity: newQty }
                    : i
            );
        });
    };

    const removeFromCart = (itemId, restaurantId) => {
        const item = cart.find(i => i.id === itemId && i.restaurantId === restaurantId);
        if (item) showNotification(`${item.name} удалено`);
        
        setCart(prev => prev.filter(i => 
            !(i.id === itemId && i.restaurantId === restaurantId)
        ));
    };

    const clearCart = () => {
        setCart([]);
        showNotification('Корзина очищена');
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartByRestaurant = cart.reduce((acc, item) => {
        if (!acc[item.restaurantId]) {
            acc[item.restaurantId] = {
                name: item.restaurantName,
                items: [],
                total: 0
            };
        }
        acc[item.restaurantId].items.push(item);
        acc[item.restaurantId].total += item.price * item.quantity;
        return acc;
    }, {});

    return (
        <AuthProvider>
            <BrowserRouter>
                <div className={`app ${darkMode ? 'dark' : ''}`}>
                    <header className="header">
                        <div className="header-content">
                            <Link to="/" className="logo">
                                <span className="logo-icon">🍽️</span>
                                <span className="logo-text">Osh<span className="logo-accent">Menu</span></span>
                            </Link>
                            
                            <div className="header-actions">
                                <button 
                                    className="btn-icon theme-toggle"
                                    onClick={toggleDarkMode}
                                    title={darkMode ? 'Дневной режим' : 'Ночной режим'}
                                >
                                    {darkMode ? '☀️' : '🌙'}
                                </button>
                                
                                <Navigation />
                            </div>
                        </div>
                    </header>

                    {notification && (
                        <div className="notification">{notification}</div>
                    )}

                    <main className="main">
                        <Routes>
                            <Route path="/" element={<Home darkMode={darkMode} />} />
                            <Route path="/restaurant/:id" element={
                                <Restaurant 
                                    cart={cart}
                                    addToCart={addToCart}
                                    updateQuantity={updateQuantity}
                                    darkMode={darkMode}
                                />
                            } />
                            <Route path="/cart" element={
                                <Cart 
                                    cart={cart}
                                    cartByRestaurant={cartByRestaurant}
                                    updateQuantity={updateQuantity}
                                    removeFromCart={removeFromCart}
                                    clearCart={clearCart}
                                    total={cartTotal}
                                    userPhone={userPhone}
                                    setUserPhone={setUserPhone}
                                />
                            } />
                            <Route path="/order-success" element={<OrderSuccess />} />
                            <Route path="/profile" element={
                                <Profile 
                                    userPhone={userPhone}
                                    setUserPhone={setUserPhone}
                                    cart={cart}
                                    clearCart={clearCart}
                                />
                            } />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/add-dish" element={<AddDish />} />
                            <Route path="/owner" element={<OwnerPanel />} />
                        </Routes>
                    </main>

                    <footer className="footer">
                        <p>© 2024 OshMenu — Онлайн меню ресторанов Оша</p>
                        <p>🌙 Ночной режим | 🎁 Скидка каждый 15-й заказ | 💎 Накопительная скидка</p>
                    </footer>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;