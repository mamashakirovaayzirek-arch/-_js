// frontend/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Home({ darkMode }) {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_URL}/restaurants`)
            .then(res => {
                setRestaurants(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="main"><p>Загрузка...</p></div>;

    return (
        <div>
            <div className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Доставка из лучших <span className="gradient-text">ресторанов Оша</span>
                    </h1>
                    <p className="hero-subtitle">
                        Заказывайте любимые блюда онлайн — быстро, удобно, со скидками!
                    </p>
                </div>
            </div>

            <div className="main">
                <h2 className="section-title">Рестораны</h2>
                
                <div className="restaurants-grid">
                    {restaurants.map(r => (
                        <Link to={`/restaurant/${r.id}`} key={r.id} className="restaurant-card">
                            <div className="restaurant-image" style={{ background: r.logo ? 'var(--white)' : 'var(--gradient)' }}>
                                {r.logo ? (
                                    <img 
                                        src={r.logo} 
                                        alt={r.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : '🍽️'}
                                {r.rating >= 4.5 && <span className="restaurant-badge">⭐ Топ</span>}
                            </div>
                            <div className="restaurant-info">
                                <h3 className="restaurant-name">{r.name}</h3>
                                <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '12px' }}>
                                    {r.description}
                                </p>
                                
                                <div className="restaurant-meta">
                                    <span className="rating">★ {r.rating}</span>
                                    <span>•</span>
                                    <span>30-45 мин</span>
                                    <span>•</span>
                                    <span>{r.address}</span>
                                </div>
                                
                                <div className="categories-tags">
                                    {r.categories.slice(0, 3).map((cat, idx) => (
                                        <span key={idx} className="category-tag">{cat}</span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home;