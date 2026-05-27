import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/restaurants');
      setRestaurants(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки ресторанов:', err);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка ресторанов...</div>;

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Доставка из лучших ресторанов <span className="gradient-text">Оша</span>
          </h1>
          <p className="hero-subtitle">
            Заказывайте любимые блюда онлайн — быстро, удобно, со скидками!
          </p>
        </div>
      </div>

      <main className="main">
        <h2 className="section-title">Рестораны</h2>
        <div className="restaurants-grid">
          {restaurants.map(r => (
            <Link to={`/restaurant/${r._id}`} key={r._id} className="restaurant-card">
              <div className="restaurant-image">
                {r.image ? (
                  <img src={`http://localhost:3001${r.image}`} alt={r.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                ) : (
                  <span style={{fontSize:'60px'}}>🍽️</span>
                )}
              </div>
              <div className="restaurant-info">
                <h3 className="restaurant-name">{r.name}</h3>
                <p className="restaurant-meta">{r.description || 'Вкусные блюда'}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;