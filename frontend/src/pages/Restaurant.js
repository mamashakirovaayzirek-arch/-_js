import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const Restaurant = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Получаем ресторан
      const restDoc = await getDoc(doc(db, 'restaurants', id));
      if (restDoc.exists()) {
        setRestaurant({ id: restDoc.id, ...restDoc.data() });
      }

      // Получаем блюда ресторана
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

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!restaurant) return <div>Ресторан не найден</div>;

  return (
    <div className="restaurant-page">
      <div className="restaurant-header">
        <Link to="/" className="back-btn">← Все рестораны</Link>
        <h1>{restaurant.name}</h1>
        <p>{restaurant.description}</p>
      </div>

      <div className="menu-section">
        <h2>Меню</h2>
        <div className="menu-grid">
          {dishes.map(dish => {
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
                    <span className="price">{dish.price} сом</span>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;