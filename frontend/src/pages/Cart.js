import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const translations = {
  ru: {
    title: '🛒 Корзина',
    empty: 'Корзина пуста',
    emptyDesc: 'Добавьте блюда из ресторанов',
    remove: 'Удалить',
    total: 'Итого',
    grandTotal: 'Общая сумма',
    checkout: '📋 Оформление заказа',
    deliveryMethod: 'Способ получения',
    delivery: '🚚 Доставка',
    pickup: '🥡 Навынос',
    dineIn: '🍽️ В заведении',
    address: 'Адрес доставки',
    addressPlaceholder: 'Улица, дом, квартира',
    table: 'Номер стола',
    tablePlaceholder: 'Например: 5',
    phone: 'Телефон',
    phonePlaceholder: '+996 XXX XXX XXX',
    submit: 'Оформить заказ на',
    submitting: 'Оформляем...',
    loginFirst: 'Сначала войдите в аккаунт!',
    emptyCart: 'Корзина пуста!',
    error: 'Ошибка оформления'
  },
  ky: {
    title: '🛒 Себет',
    empty: 'Себет бош',
    emptyDesc: 'Ресторандан тамак кошуңуз',
    remove: 'Өчүрүү',
    total: 'Жыйынтыгы',
    grandTotal: 'Жалпы сумма',
    checkout: '📋 Буйрутма берүү',
    deliveryMethod: 'Алуу ыкмасы',
    delivery: '🚚 Жеткирүү',
    pickup: '🥡 Алуу',
    dineIn: '🍽️ Жайдан',
    address: 'Жеткирүү дареги',
    addressPlaceholder: 'Көчө, үй, батир',
    table: 'Стол номери',
    tablePlaceholder: 'Мисалы: 5',
    phone: 'Телефон',
    phonePlaceholder: '+996 XXX XXX XXX',
    submit: 'Буйрутма берүү',
    submitting: 'Буйрутма берилүүдө...',
    loginFirst: 'Алгач аккаунтуңузга кириңиз!',
    emptyCart: 'Себет бош!',
    error: 'Буйрутма катасы'
  }
};

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [table, setTable] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(saved);
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const removeItem = (dishId) => {
    const newCart = cart.filter(item => item.dishId !== dishId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (dishId, delta) => {
    const newCart = cart.map(item => {
      if (item.dishId === dishId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? {...item, quantity: newQty} : null;
      }
      return item;
    }).filter(Boolean);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const cartByRestaurant = cart.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = { name: item.restaurantName, items: [] };
    }
    acc[item.restaurantId].items.push(item);
    return acc;
  }, {});

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t.loginFirst);
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      alert(t.emptyCart);
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        dishes: cart.map(item => ({
          dishId: item.dishId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        finalAmount: totalAmount,
        discountApplied: 0,
        status: 'pending',
        orderType,
        phone,
        address: orderType === 'delivery' ? address : (orderType === 'dine-in' ? `Стол ${table}` : 'Самовывоз'),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      localStorage.removeItem('cart');
      setCart([]);
      navigate('/order-success');
    } catch (err) {
      alert(t.error + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">🛒</div>
        <h2>{t.empty}</h2>
        <p>{t.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>{t.title}</h1>

      {Object.entries(cartByRestaurant).map(([restId, data]) => (
        <div key={restId} className="cart-restaurant">
          <h3>{data.name}</h3>
          {data.items.map(item => (
            <div key={item.dishId} className="cart-item">
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <p className="cart-item-price">{item.price} сом</p>
              </div>
              <div className="quantity-control">
                <button className="qty-btn" onClick={() => updateQuantity(item.dishId, -1)}>−</button>
                <span className="quantity">{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.dishId, 1)}>+</button>
              </div>
              <span className="cart-item-total">{item.price * item.quantity} сом</span>
              <button className="delete-btn" onClick={() => removeItem(item.dishId)}>🗑️</button>
            </div>
          ))}
          <div className="cart-restaurant-total">
            {t.total}: {data.items.reduce((s, i) => s + i.price * i.quantity, 0)} сом
          </div>
        </div>
      ))}

      <div className="grand-total">
        <p>{t.grandTotal}:</p>
        <p className="grand-total-amount">{totalAmount} сом</p>
      </div>

      <form onSubmit={handleSubmit} className="order-section">
        <h2>{t.checkout}</h2>

        <div className="form-group">
          <label>{t.deliveryMethod}</label>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" value="delivery" checked={orderType === 'delivery'} onChange={(e) => setOrderType(e.target.value)} />
              {t.delivery}
            </label>
            <label className="radio-label">
              <input type="radio" value="pickup" checked={orderType === 'pickup'} onChange={(e) => setOrderType(e.target.value)} />
              {t.pickup}
            </label>
            <label className="radio-label">
              <input type="radio" value="dine-in" checked={orderType === 'dine-in'} onChange={(e) => setOrderType(e.target.value)} />
              {t.dineIn}
            </label>
          </div>
        </div>

        {orderType === 'delivery' && (
          <div className="form-group">
            <label>{t.address}</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} required />
          </div>
        )}

        {orderType === 'dine-in' && (
          <div className="form-group">
            <label>{t.table}</label>
            <input type="text" value={table} onChange={(e) => setTable(e.target.value)} placeholder={t.tablePlaceholder} required />
          </div>
        )}

        <div className="form-group">
          <label>{t.phone}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePlaceholder} required />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? t.submitting : `${t.submit} ${totalAmount} сом`}
        </button>
      </form>
    </div>
  );
};

export default Cart;