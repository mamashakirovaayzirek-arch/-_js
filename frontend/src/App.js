// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import './App.css';

const API_URL = 'http://localhost:3001/api';

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
                            
                            <Link to="/profile" className="profile-link">
                                👤 Профиль
                            </Link>
                            
                            <Link to="/cart" className="btn-icon cart-btn">
                                🛒
                                {cartCount > 0 && (
                                    <>
                                        <span className="cart-badge">{cartCount}</span>
                                        <span style={{ marginLeft: '4px' }}>{cartTotal} сом</span>
                                    </>
                                )}
                            </Link>
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
                    </Routes>
                </main>

                <footer className="footer">
                    <p>© 2024 OshMenu — Онлайн меню ресторанов Оша</p>
                    <p>🌙 Ночной режим | 🎁 Скидка каждый 15-й заказ</p>
                </footer>
            </div>
        </BrowserRouter>
    );
}

export default App;