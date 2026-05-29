import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const translations = {
  ru: {
    title: 'Доставка из лучших ресторанов',
    city: 'Оша',
    subtitle: 'Заказывайте любимые блюда онлайн — быстро, удобно, со скидками!',
    restaurants: 'Рестораны',
    defaultDesc: 'Вкусные блюда',
    loading: 'Загрузка ресторанов...'
  },
  ky: {
    title: 'Эң мыкты ресторандардан жеткирүү',
    city: 'Оштон',
    subtitle: 'Сүйүктүү тамактарыңызды онлайн буйрутсаңыз — тез, ыңгайлуу, арзандатуулар менен!',
    restaurants: 'Ресторандар',
    defaultDesc: 'Даамдуу тамактар',
    loading: 'Ресторандар жүктөлүүдө...'
  }
};

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    fetchRestaurants();
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'ru');
    };
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const fetchRestaurants = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const restaurantsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRestaurants(restaurantsList);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки ресторанов:', err);
      setLoading(false);
    }
  };

  // Получаем URL картинки — ищем все возможные поля
  const getImageUrl = (restaurant) => {
    return restaurant.imageBase64 || restaurant.image || restaurant.photo || restaurant.imageUrl || restaurant.picture || restaurant.logo || null;
  };

  if (loading) return <div className="loading">{t.loading}</div>;

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            {t.title} <span className="gradient-text">{t.city}</span>
          </h1>
          <p className="hero-subtitle">
            {t.subtitle}
          </p>
        </div>
      </div>

      <main className="main">
        <h2 className="section-title">{t.restaurants}</h2>
        <div className="restaurants-grid">
          {restaurants.map(r => {
            const imgUrl = getImageUrl(r);
            
            return (
              <Link to={`/restaurant/${r.id}`} key={r.id} className="restaurant-card">
                <div className="restaurant-image">
                  {imgUrl ? (
                    <img 
                      src={imgUrl} 
                      alt={r.name} 
                      style={{width:'100%', height:'100%', objectFit:'cover'}} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.insertAdjacentHTML('beforeend', '<span style="font-size:60px">🍽️</span>');
                      }}
                    />
                  ) : (
                    <span style={{fontSize:'60px'}}>🍽️</span>
                  )}
                </div>
                <div className="restaurant-info">
                  <h3 className="restaurant-name">{r.name}</h3>
                  <p className="restaurant-meta">{r.description || t.defaultDesc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Home;