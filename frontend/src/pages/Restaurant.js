import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from 'firebase/firestore';

const translations = {
  ru: {
    back: '← Все рестораны',
    menu: 'Меню',
    all: 'Все',
    notFound: 'Ресторан не найден',
    loading: 'Загрузка...',
    price: 'сом',
    noIngredients: 'Ингредиенттер көрсөтүлгөн эмес',
    edit: '✏️ Өзгөртүү',
    delete: '🗑️ Өчүрүү',
    addDish: '+ Тамак кошуу',
    confirmDelete: 'Тамакты өчүрүү?',
    miniCartTitle: '🛒 Ваш заказ',
    miniCartEmpty: 'Добавьте блюда',
    miniCartTotal: 'Итого',
    miniCartOrder: '📋 Оформить заказ',
    continueShopping: 'Продолжить покупки'
  },
  ky: {
    back: '← Бардык ресторандар',
    menu: 'Меню',
    all: 'Баары',
    notFound: 'Ресторан табылган жок',
    loading: 'Жүктөлүүдө...',
    price: 'сом',
    noIngredients: 'Ингредиенттер көрсөтүлгөн эмес',
    edit: '✏️ Өзгөртүү',
    delete: '🗑️ Өчүрүү',
    addDish: '+ Тамак кошуу',
    confirmDelete: 'Тамакты өчүрүү?',
    miniCartTitle: '🛒 Сиздин буйрутмаңыз',
    miniCartEmpty: 'Тамак кошуңуз',
    miniCartTotal: 'Жыйынтыгы',
    miniCartOrder: '📋 Буйрутма берүү',
    continueShopping: 'Сатып алууну улантуу'
  }
};

const Restaurant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [firestoreCategories, setFirestoreCategories] = useState([]);

  const t = translations[lang];
  const isOwner = user && user.role === 'owner' && (user.restaurantId === id || user.restaurant === id);

  useEffect(() => {
    fetchData();
    fetchCategories();
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, [id]);

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      const cats = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setFirestoreCategories(cats);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

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

  const getCategoriesForRestaurant = () => {
    const dishCategoryNames = [...new Set(dishes.map(d => d.category).filter(Boolean))];
    
    const result = [
      { key: 'all', nameRu: 'Все', nameKy: 'Баары' }
    ];

    dishCategoryNames.forEach(catName => {
      const firestoreCat = firestoreCategories.find(c => 
        c.nameRu === catName || c.nameKy === catName
      );

      if (firestoreCat) {
        result.push({
          key: catName,
          nameRu: firestoreCat.nameRu,
          nameKy: firestoreCat.nameKy
        });
      } else {
        result.push({
          key: catName,
          nameRu: catName,
          nameKy: catName
        });
      }
    });

    return result;
  };

  const handleDeleteDish = async (dishId) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await deleteDoc(doc(db, 'dishes', dishId));
      setDishes(dishes.filter(d => d.id !== dishId));
    } catch (err) {
      alert('Ката өчүрүүдө: ' + err.message);
    }
  };

  const handleEditDish = (dishId) => {
    navigate(`/edit-dish/${dishId}`);
  };

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
    setShowMiniCart(true);
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredDishes = activeCategory === 'all' 
    ? dishes 
    : dishes.filter(d => d.category === activeCategory);

  if (loading) return <div className="loading">{t.loading}</div>;
  if (!restaurant) return <div>{t.notFound}</div>;

  const categories = getCategoriesForRestaurant();

  return (
    <div className="restaurant-page">
      <div className={`mini-cart-overlay ${showMiniCart ? 'show' : ''}`} onClick={() => setShowMiniCart(false)}></div>
      <div className={`mini-cart ${showMiniCart ? 'show' : ''}`}>
        <div className="mini-cart-header">
          <h3>{t.miniCartTitle}</h3>
          <button className="close-btn" onClick={() => setShowMiniCart(false)}>✕</button>
        </div>
        
        <div className="mini-cart-body">
          {cart.length === 0 ? (
            <p className="mini-cart-empty">{t.miniCartEmpty}</p>
          ) : (
            cart.map(item => (
              <div key={item.dishId} className="mini-cart-item">
                <div className="mini-cart-item-info">
                  <span className="mini-cart-name">{item.name}</span>
                  <span className="mini-cart-price">{item.price} {t.price}</span>
                </div>
                <div className="mini-cart-qty">
                  <button onClick={() => removeFromCart(item.dishId)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => {
                    const dish = dishes.find(d => d.id === item.dishId);
                    if (dish) addToCart(dish);
                  }}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mini-cart-footer">
          <div className="mini-cart-total">
            <span>{t.miniCartTotal}:</span>
            <span className="total-amount">{cartTotal} {t.price}</span>
          </div>
          <button 
            className="mini-cart-order-btn"
            onClick={() => {
              setShowMiniCart(false);
              navigate('/cart');
            }}
            disabled={cart.length === 0}
          >
            {t.miniCartOrder}
          </button>
        </div>
      </div>

      {cartCount > 0 && (
        <button className="floating-cart-btn" onClick={() => setShowMiniCart(true)}>
          🛒 <span className="cart-badge">{cartCount}</span>
          <span className="cart-sum">{cartTotal} {t.price}</span>
        </button>
      )}

      <div className="restaurant-header">
        <Link to="/" className="back-btn">{t.back}</Link>
        <h1>{restaurant.name}</h1>
        <p>{restaurant.description}</p>
        
        {isOwner && (
          <button className="owner-add-btn" onClick={() => navigate('/add-dish')}>
            {t.addDish}
          </button>
        )}
      </div>

      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={activeCategory === cat.key ? 'active' : ''}
            onClick={() => setActiveCategory(cat.key)}
          >
            {lang === 'ru' ? cat.nameRu : cat.nameKy}
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
                  ) : (
                    <div className="placeholder-image">🍽️</div>
                  )}
                </div>
                <div className="menu-item-content">
                  <h3>{dish.name}</h3>
                  <p className="menu-item-description">
                    {dish.ingredients || t.noIngredients}
                  </p>
                  <div className="menu-item-footer">
                    <span className="price">{dish.price} {t.price}</span>
                    {qty === 0 ? (
                      <button className="add-btn" onClick={() => addToCart(dish)}>+</button>
                    ) : (
                      <div className="quantity-control">
                        <button className="qty-btn" onClick={() => removeFromCart(dish.id)}>−</button>
                        <span className="quantity">{qty}</span>
                        <button className="qty-btn" onClick={() => addToCart(dish)}>+</button>
                      </div>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="owner-actions">
                    <button className="edit-btn" onClick={() => handleEditDish(dish.id)}>
                      {t.edit}
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteDish(dish.id)}>
                      {t.delete}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;