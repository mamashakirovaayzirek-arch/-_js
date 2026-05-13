// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Profile({ userPhone, setUserPhone, cart, clearCart }) {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [phoneInput, setPhoneInput] = useState(userPhone);

    useEffect(() => {
        if (userPhone) {
            loadUserData();
        }
    }, [userPhone]);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const [ordersRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/orders/user/${userPhone}`),
                axios.get(`${API_URL}/discount/${userPhone}`)
            ]);
            setOrders(ordersRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const savePhone = () => {
        if (phoneInput.length < 10) {
            alert('Введите корректный номер телефона');
            return;
        }
        setUserPhone(phoneInput);
        localStorage.setItem('oshmenu_phone', phoneInput);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusText = (status) => {
        const statuses = {
            'new': 'Новый',
            'confirmed': 'Подтверждён',
            'cooking': 'Готовится',
            'ready': 'Готов',
            'delivered': 'Доставлен',
            'cancelled': 'Отменён'
        };
        return statuses[status] || status;
    };

    if (!userPhone) {
        return (
            <div className="profile-page">
                <div className="phone-input-section">
                    <div className="profile-avatar">👤</div>
                    <h2>Введите номер телефона</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
                        Для сохранения истории заказов и скидок
                    </p>
                    <div className="form-group phone-input">
                        <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="+996 XXX XXX XXX"
                        />
                    </div>
                    <button onClick={savePhone} className="submit-btn">
                        Сохранить
                    </button>
                    <Link to="/" className="back-btn" style={{ marginTop: '20px' }}>
                        ← На главную
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">👤</div>
                <h1>Мой профиль</h1>
                <p className="profile-phone">{userPhone}</p>
                
                {stats && (
                    <div className="profile-stats">
                        <div className="stat-card">
                            <div className="stat-value">{stats.orderCount}</div>
                            <div className="stat-label">Заказов</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.totalSpent}</div>
                            <div className="stat-label">Потрачено (сом)</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">
                                {stats.discountAvailable ? '🎁' : stats.nextDiscountIn}
                            </div>
                            <div className="stat-label">
                                {stats.discountAvailable ? 'Скидка доступна!' : 'До скидки'}
                            </div>
                        </div>
                    </div>
                )}

                {stats && (
                    <div className="discount-progress">
                        <h3>🎁 Программа лояльности</h3>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${((15 - stats.nextDiscountIn) / 15) * 100}%` }}
                            ></div>
                        </div>
                        <p className="progress-text">
                            {stats.discountAvailable 
                                ? '✨ У вас есть скидка 800 сом на следующий заказ!' 
                                : `Закажите ещё ${stats.nextDiscountIn} раз и получите скидку 800 сом`
                            }
                        </p>
                    </div>
                )}

                <button 
                    onClick={() => {
                        setUserPhone('');
                        localStorage.removeItem('oshmenu_phone');
                    }}
                    className="clear-cart-btn"
                    style={{ marginTop: '20px' }}
                >
                    🚪 Выйти
                </button>
            </div>

            {cart.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <Link to="/cart" className="back-btn">
                        🛒 У вас {cart.length} товаров в корзине
                    </Link>
                </div>
            )}

            <div className="order-history">
                <h2>📋 История заказов</h2>
                
                {loading ? (
                    <p>Загрузка...</p>
                ) : orders.length === 0 ? (
                    <div className="empty-orders">
                        <div className="empty-orders-icon">📭</div>
                        <p>У вас пока нет заказов</p>
                        <Link to="/" className="back-btn" style={{ marginTop: '20px' }}>
                            Сделать первый заказ
                        </Link>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <span className="order-number">Заказ #{order.id}</span>
                                <span className={`order-status status-${order.status}`}>
                                    {getStatusText(order.status)}
                                </span>
                                <span className="order-date">{formatDate(order.createdAt)}</span>
                            </div>
                            
                            <div className="order-items">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="order-item">
                                        <span>{item.name} × {item.quantity}</span>
                                        <span>{item.price * item.quantity} сом</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="order-total">
                                {order.discountUsed && (
                                    <div className="order-discount">
                                        Скидка 800 сом применена!
                                    </div>
                                )}
                                Итого: {order.total} сом
                                {order.discountUsed && (
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                                        Было: {order.originalTotal} сом
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Profile;