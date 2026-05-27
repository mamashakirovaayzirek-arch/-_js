import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const translations = {
  ru: {
    back: '← Все рестораны',
    menu: 'Меню',
    all: 'Все',
    drinks: 'Суусундуктар / Чайлар',
    breakfast: 'Таңкы тамактар',
    firstCourse: 'Биринчи тамактар',
    secondCourse: 'Экинчи тамактар',
    salads: 'Салаттар',
    extras: 'Кошумчалар',
    add: '+',
    remove: '−',
    notFound: 'Ресторан не найден',
    loading: 'Загрузка...',
    price: 'сом'
  },
  ky: {
    back: '← Бардык ресторандар',
    menu: 'Меню',
    all: 'Баары',
    drinks: 'Суусундуктар / Чайлар',
    breakfast: 'Таңкы тамактар',
    firstCourse: 'Биринчи тамактар',
    secondCourse: 'Экинчи тамактар',
    salads: 'Салаттар',
    extras: 'Кошумчалар',
    add: '+',
    remove: '−',
    notFound: 'Ресторан табылган жок',
    loading: 'Жүктөлүүдө...',
    price: 'сом'
  }
};

const categories = [
  { key: 'all', ru: 'Все', ky: 'Баары' },
  { key: 'drinks', ru: 'Суусундуктар / Чайлар', ky: 'Суусундуктар / Чайлар' },
  { key: 'breakfast', ru: 'Таңкы тамактар', ky: 'Таңкы тамактар' },
  { key: 'firstCourse', ru: 'Биринчи тамактар', ky: 'Биринчи тамактар' },
  { key: 'secondCourse', ru: 'Экинчи тамактар', ky: 'Экинчи тамактар' },
  { key: 'salads', ru: 'Салаттар', ky: 'Салаттар' },
  { key: 'extras', ru: 'Кошумчалар', ky: 'Кошумчалар' }
];

const Restaurant = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    fetchData();
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'ru');
    };
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, [id]);

  const fetchData = async () => {
    try {
      const restDoc = await getDoc(doc(db, 'restaurants', id));
      if (restDoc.exists()) {
        setRestaurant({ id: restDoc.id, ...restDoc.data() });
      }

      const q = query(collection(db, 'dishes'), where('restaurantId', '==', id));
      const querySnapshot = await getDocs(q);
      const dishesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDishes(dishesList);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка:', err);
      setLoading(false);
    }
  };

  const filteredDishes = activeCategory === 'all' 
    ? dishes 
    : dishes.filter(d => d.category === activeCategory);

  const addToCart = (dish) => {
    const existing = cart.find(item => item.dishId === dish.id);
    let newCart;
    if (existing) {
      newCart = cart.map(item => 
        item.dishId === dish.id ? {...item, quantity: item.quantity + 1} : item
      );
    } else {
      newCart = [...cart, {
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1,
        restaurantId: id,
        restaurantName: restaurant?.name
      }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (dishId) => {
    const existing = cart.find(item => item.dishId === dishId);
    let newCart;
    if (existing.quantity > 1) {
      newCart = cart.map(item => 
        item.dishId === dishId ? {...item, quantity: item.quantity - 1} : item
      );
    } else {
      newCart = cart.filter(item => item.dishId !== dishId);
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getQuantity = (dishId) => {
    const item = cart.find(c => c.dishId === dishId);
    return item ? item.quantity : 0;
  };

  if (loading) return <div className="loading">{t.loading}</div>;
  if (!restaurant) return <div>{t.notFound}</div>;

  return (
    <div className="restaurant-page">
      <div className="restaurant-header">
        <Link to="/" className="back-btn">{t.back}</Link>
        <h1>{restaurant.name}</h1>
        <p>{restaurant.description}</p>
      </div>

      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={activeCategory === cat.key ? 'active' : ''}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat[lang]}
          </button>
        ))}
      </div>

      <div className="menu-section">
        <h2>{t.menu}</h2>
        <div className="menu-grid">
          {filteredDishes.map(dish => {
            const qty = getQuantity(dish.id);
            return (
              <div key={dish.id} className="menu-item">
                <div className="menu-item-image">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  ) : '🍽️'}
                </div>
                <div className="menu-item-content">
                  <h3>{dish.name}</h3>
                  <p className="menu-item-description">{dish.ingredients}</p>
                  <div className="menu-item-footer">
                    <span className="price">{dish.price} {t.price}</span>
                    {qty === 0 ? (
                      <button className="add-btn" onClick={() => addToCart(dish)}>{t.add}</button>
                    ) : (
                      <div className="quantity-control">
                        <button className="qty-btn" onClick={() => removeFromCart(dish.id)}>{t.remove}</button>
                        <span className="quantity">{qty}</span>
                        <button className="qty-btn" onClick={() => addToCart(dish)}>{t.add}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;