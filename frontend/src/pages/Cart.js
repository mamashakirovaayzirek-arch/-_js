import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [table, setTable] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(saved);
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
      alert('Сначала войдите в аккаунт!');
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      alert('Корзина пуста!');
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
      alert('Ошибка оформления: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">🛒</div>
        <h2>Корзина пуста</h2>
        <p>Добавьте блюда из ресторанов</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>🛒 Корзина</h1>

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
            Итого: {data.items.reduce((s, i) => s + i.price * i.quantity, 0)} сом
          </div>
        </div>
      ))}

      <div className="grand-total">
        <p>Общая сумма:</p>
        <p className="grand-total-amount">{totalAmount} сом</p>
      </div>

      <form onSubmit={handleSubmit} className="order-section">
        <h2>📋 Оформление заказа</h2>

        <div className="form-group">
          <label>Способ получения</label>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" value="delivery" checked={orderType === 'delivery'} onChange={(e) => setOrderType(e.target.value)} />
              🚚 Доставка
            </label>
            <label className="radio-label">
              <input type="radio" value="pickup" checked={orderType === 'pickup'} onChange={(e) => setOrderType(e.target.value)} />
              🥡 Навынос
            </label>
            <label className="radio-label">
              <input type="radio" value="dine-in" checked={orderType === 'dine-in'} onChange={(e) => setOrderType(e.target.value)} />
              🍽️ В заведении
            </label>
          </div>
        </div>

        {orderType === 'delivery' && (
          <div className="form-group">
            <label>Адрес доставки</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом, квартира" required />
          </div>
        )}

        {orderType === 'dine-in' && (
          <div className="form-group">
            <label>Номер стола</label>
            <input type="text" value={table} onChange={(e) => setTable(e.target.value)} placeholder="Например: 5" required />
          </div>
        )}

        <div className="form-group">
          <label>Телефон</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+996 XXX XXX XXX" required />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Оформляем...' : `Оформить заказ на ${totalAmount} сом`}
        </button>
      </form>
    </div>
  );
};

export default Cart;