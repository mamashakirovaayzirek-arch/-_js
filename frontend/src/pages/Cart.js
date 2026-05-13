// frontend/src/pages/Cart.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Cart({ cart, cartByRestaurant, updateQuantity, removeFromCart, clearCart, total, userPhone, setUserPhone }) {
    const navigate = useNavigate();
    const [orderType, setOrderType] = useState('takeaway');
    const [phone, setPhone] = useState(userPhone || '');
    const [address, setAddress] = useState('');
    const [table, setTable] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [discount, setDiscount] = useState(null);
    const [useDiscount, setUseDiscount] = useState(false);

    useEffect(() => {
        if (phone.length >= 10) {
            checkDiscount(phone);
        }
    }, [phone]);

    const checkDiscount = async (phoneNumber) => {
        try {
            const res = await axios.get(`${API_URL}/discount/${phoneNumber}`);
            setDiscount(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const finalTotal = useDiscount && discount?.discountAvailable 
        ? Math.max(0, total - 800) 
        : total;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!phone) {
            alert('Введите номер телефона');
            return;
        }

        setSubmitting(true);
        setUserPhone(phone);
        localStorage.setItem('oshmenu_phone', phone);

        const restaurantIds = Object.keys(cartByRestaurant);
        
        try {
            for (const restId of restaurantIds) {
                const restData = cartByRestaurant[restId];
                
                await axios.post(`${API_URL}/orders`, {
                    restaurantId: parseInt(restId),
                    items: restData.items.map(i => ({
                        id: i.id,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity
                    })),
                    total: useDiscount && discount?.discountAvailable ? finalTotal : restData.total,
                    type: orderType,
                    phone,
                    address: orderType === 'delivery' ? address : null,
                    table: orderType === 'dine-in' ? table : null,
                    comment,
                    discountUsed: useDiscount && discount?.discountAvailable
                });
            }

            clearCart();
            navigate('/order-success');
        } catch (err) {
            alert('Ошибка при оформлении: ' + err.message);
            setSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="cart-page">
                <div className="empty-cart">
                    <div className="empty-cart-icon">🛒</div>
                    <h2>Корзина пуста</h2>
                    <p>Добавьте блюда из меню ресторанов</p>
                    <Link to="/" className="back-btn">Выбрать ресторан</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <h1>🛒 Корзина</h1>
            
            <button onClick={clearCart} className="clear-cart-btn">
                🗑️ Очистить корзину
            </button>

            {discount?.discountAvailable && (
                <div className={`discount-banner ${useDiscount ? 'active' : ''}`}>
                    <div className="discount-icon">🎁</div>
                    <div className="discount-text">
                        <h3>Скидка 800 сом доступна!</h3>
                        <p>У вас каждый 15-й заказ. Применить?</p>
                    </div>
                    <button 
                        onClick={() => setUseDiscount(!useDiscount)}
                        className="add-btn"
                        style={{ background: useDiscount ? '#e74c3c' : '#27ae60' }}
                    >
                        {useDiscount ? 'Отменить' : 'Применить'}
                    </button>
                </div>
            )}

            {Object.entries(cartByRestaurant).map(([restId, data]) => (
                <div key={restId} className="cart-restaurant">
                    <h3>{data.name}</h3>
                    
                    {data.items.map(item => (
                        <div key={item.id} className="cart-item">
                            <div className="cart-item-info">
                                <h4>{item.name}</h4>
                                <p className="cart-item-price">{item.price} сом × {item.quantity}</p>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="quantity-control">
                                    <button 
                                        className="qty-btn"
                                        onClick={() => updateQuantity(item.id, parseInt(restId), -1)}
                                    >
                                        −
                                    </button>
                                    <span className="quantity">{item.quantity}</span>
                                    <button 
                                        className="qty-btn"
                                        onClick={() => updateQuantity(item.id, parseInt(restId), 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                
                                <span className="cart-item-total">
                                    {item.price * item.quantity} сом
                                </span>
                                
                                <button 
                                    className="delete-btn"
                                    onClick={() => removeFromCart(item.id, parseInt(restId))}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <div className="cart-restaurant-total">
                        Итого по ресторану: {data.total} сом
                    </div>
                </div>
            ))}

            <form onSubmit={handleSubmit} className="order-section">
                <h2>📋 Оформление заказа</h2>

                <div className="form-group">
                    <label>Способ получения</label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input 
                                type="radio" 
                                name="type" 
                                value="takeaway"
                                checked={orderType === 'takeaway'}
                                onChange={(e) => setOrderType(e.target.value)}
                            />
                            🥡 Навынос
                        </label>
                        <label className="radio-label">
                            <input 
                                type="radio" 
                                name="type" 
                                value="dine-in"
                                checked={orderType === 'dine-in'}
                                onChange={(e) => setOrderType(e.target.value)}
                            />
                            🍽️ В заведении
                        </label>
                        <label className="radio-label">
                            <input 
                                type="radio" 
                                name="type" 
                                value="delivery"
                                checked={orderType === 'delivery'}
                                onChange={(e) => setOrderType(e.target.value)}
                            />
                            🚚 Доставка
                        </label>
                    </div>
                </div>

                {orderType === 'dine-in' && (
                    <div className="form-group">
                        <label>Номер стола</label>
                        <input 
                            type="number" 
                            value={table}
                            onChange={(e) => setTable(e.target.value)}
                            placeholder="Например: 5"
                            required
                        />
                    </div>
                )}

                {orderType === 'delivery' && (
                    <div className="form-group">
                        <label>Адрес доставки</label>
                        <input 
                            type="text" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Улица, дом, квартира"
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label>Телефон</label>
                    <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+996 XXX XXX XXX"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Комментарий</label>
                    <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Особые пожелания..."
                        rows="3"
                    />
                </div>

                <div className={`grand-total ${useDiscount && discount?.discountAvailable ? 'discount-applied' : ''}`}>
                    <p>Общая сумма</p>
                    <p className="grand-total-amount">{finalTotal} сом</p>
                    {useDiscount && discount?.discountAvailable && (
                        <p className="discount-info">
                            💰 Скидка 800 сом применена! (было {total} сом)
                        </p>
                    )}
                    {!useDiscount && discount?.discountAvailable && (
                        <p className="discount-info">
                            🎁 Скидка 800 сом доступна! Включите выше ↑
                        </p>
                    )}
                </div>

                <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={submitting}
                >
                    {submitting ? '⏳ Оформляем...' : '✓ Подтвердить заказ'}
                </button>
            </form>
        </div>
    );
}

export default Cart;