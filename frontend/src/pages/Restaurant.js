// frontend/src/pages/Restaurant.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Restaurant({ cart, addToCart, updateQuantity, darkMode }) {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_URL}/restaurants/${id}`)
            .then(res => {
                setRestaurant(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    const getItemQuantity = (itemId) => {
        const item = cart.find(i => i.id === itemId && i.restaurantId === parseInt(id));
        return item ? item.quantity : 0;
    };

    if (loading) return <div className="main"><p>Загрузка...</p></div>;
    if (!restaurant) return <div className="main"><p>Ресторан не найден</p></div>;

    const categories = restaurant.categories;

    return (
        <div className="main">
            <div className="restaurant-header">
                <h1>{restaurant.name}</h1>
                <div className="restaurant-meta" style={{ marginBottom: '16px' }}>
                    <span className="rating">★ {restaurant.rating}</span>
                    <span>•</span>
                    <span>30-45 мин</span>
                    <span>•</span>
                    <span>Бесплатная доставка от 500 сом</span>
                </div>
                <p style={{ color: 'var(--gray-700)' }}>{restaurant.description}</p>
                <div className="restaurant-contacts" style={{ marginTop: '16px' }}>
                    <span>📍 {restaurant.address}</span>
                    <span>📞 {restaurant.phone}</span>
                </div>
            </div>

            <div className="category-filter">
                <button 
                    className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                >
                    Все меню
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.name}
                        className={`category-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.name)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {categories.map(category => {
                if (selectedCategory !== 'all' && selectedCategory !== category.name) return null;
                
                return (
                    <div key={category.name} className="menu-section">
                        <h2>{category.name}</h2>
                        <div className="menu-grid">
                            {category.items.map(item => {
                                const qty = getItemQuantity(item.id);
                                
                                return (
                                    <div key={item.id} className="menu-item">
                                        <div className="menu-item-image">
                                            {item.image ? (
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🍽️'; }}
                                                />
                                            ) : '🍽️'}
                                        </div>
                                        <div className="menu-item-content">
                                            <h3>{item.name}</h3>
                                            <p className="menu-item-description">{item.description}</p>
                                            
                                            <div className="menu-item-footer">
                                                <span className="price">{item.price} сом</span>
                                                
                                                {qty === 0 ? (
                                                    <button 
                                                        className="add-btn"
                                                        onClick={() => addToCart(item, parseInt(id), restaurant.name)}
                                                    >
                                                        +
                                                    </button>
                                                ) : (
                                                    <div className="quantity-control">
                                                        <button 
                                                            className="qty-btn"
                                                            onClick={() => updateQuantity(item.id, parseInt(id), -1)}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="quantity">{qty}</span>
                                                        <button 
                                                            className="qty-btn"
                                                            onClick={() => updateQuantity(item.id, parseInt(id), 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <Link to="/" className="back-btn">← Все рестораны</Link>
            </div>
        </div>
    );
}

export default Restaurant;