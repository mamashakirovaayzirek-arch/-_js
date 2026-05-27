import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const translations = {
  ru: {
    title: 'Мой профиль',
    orders: 'Заказов',
    spent: 'Потрачено (сом)',
    discount: 'Скидка доступна!',
    toDiscount: 'До скидки',
    loyalty: '🎁 Программа лояльности',
    discountText: 'У вас есть скидка 800 сом на следующий заказ!',
    discountProgress: 'Закажите ещё {count} раз и получите скидку 800 сом',
    logout: '🚪 Выйти',
    orderHistory: '📋 История заказов',
    loading: 'Загрузка...',
    noOrders: 'У вас пока нет заказов',
    firstOrder: 'Сделать первый заказ',
    cartItems: 'товаров в корзине',
    status: {
      pending: 'Ожидание',
      cooking: 'Готовится',
      ready: 'Готов',
      completed: 'Завершён',
      cancelled: 'Отменён'
    }
  },
  ky: {
    title: 'Менин профилим',
    orders: 'Буйрутмалар',
    spent: 'Кеткен (сом)',
    discount: 'Арзандатуу бар!',
    toDiscount: 'Арзандатууга чейин',
    loyalty: '🎁 Лоялдуулук программасы',
    discountText: 'Кийинки буйрутмага 800 сом арзандатууңуз бар!',
    discountProgress: 'Дагы {count} жолу буйрутма берсеңиз, 800 сом арзандатуу аласыз',
    logout: '🚪 Чыгуу',
    orderHistory: '📋 Буйрутма тарыхы',
    loading: 'Жүктөлүүдө...',
    noOrders: 'Сизде азырынча буйрутма жок',
    firstOrder: 'Биринчи буйрутма берүү',
    cartItems: 'товар себетте',
    status: {
      pending: 'Күтүүдө',
      cooking: 'Даярдалууда',
      ready: 'Даяр',
      completed: 'Аяктады',
      cancelled: 'Жокко чыгарылды'
    }
  }
};

const Profile = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ orderCount: 0, totalSpent: 0, discountAvailable: false, nextDiscountIn: 15 });
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.id));
      const snapshot = await getDocs(q);
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalSpent = ordersList.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
      const orderCount = ordersList.length;
      const discountAvailable = orderCount >= 15;
      const nextDiscountIn = Math.max(0, 15 - (orderCount % 15));

      setOrders(ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setStats({ orderCount, totalSpent, discountAvailable, nextDiscountIn });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(lang === 'ru' ? 'ru-RU' : 'ky-KG', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    return t.status[status] || status;
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="phone-input-section">
          <div className="profile-avatar">👤</div>
          <h2>{lang === 'ru' ? 'Войдите в аккаунт' : 'Аккаунтуңузга кириңиз'}</h2>
          <Link to="/login" className="submit-btn">
            {lang === 'ru' ? 'Войти' : 'Кирүү'}
          </Link>
        </div>
      </div>
    );
  }

  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <h1>{t.title}</h1>
        <p className="profile-phone">{user.email}</p>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.orderCount}</div>
            <div className="stat-label">{t.orders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalSpent}</div>
            <div className="stat-label">{t.spent}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {stats.discountAvailable ? '🎁' : stats.nextDiscountIn}
            </div>
            <div className="stat-label">
              {stats.discountAvailable ? t.discount : t.toDiscount}
            </div>
          </div>
        </div>

        <div className="discount-progress">
          <h3>{t.loyalty}</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((15 - stats.nextDiscountIn) / 15) * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {stats.discountAvailable 
              ? t.discountText
              : t.discountProgress.replace('{count}', stats.nextDiscountIn)
            }
          </p>
        </div>

        <button 
          onClick={logout}
          className="clear-cart-btn"
          style={{ marginTop: '20px' }}
        >
          {t.logout}
        </button>
      </div>

      {cart.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <Link to="/cart" className="back-btn">
            🛒 {cart.length} {t.cartItems}
          </Link>
        </div>
      )}

      <div className="order-history">
        <h2>{t.orderHistory}</h2>

        {loading ? (
          <p>{t.loading}</p>
        ) : orders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-orders-icon">📭</div>
            <p>{t.noOrders}</p>
            <Link to="/" className="back-btn" style={{ marginTop: '20px' }}>
              {t.firstOrder}
            </Link>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-number">Заказ #{order.id?.slice(-6)}</span>
                <span className={`order-status status-${order.status}`}>
                  {getStatusText(order.status)}
                </span>
                <span className="order-date">{formatDate(order.createdAt)}</span>
              </div>

              <div className="order-items">
                {order.dishes?.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{item.price * item.quantity} сом</span>
                  </div>
                ))}
              </div>

              <div className="order-total">
                {order.discountApplied > 0 && (
                  <div className="order-discount">
                    Скидка {order.discountApplied} сом применена!
                  </div>
                )}
                Итого: {order.finalAmount} сом
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;