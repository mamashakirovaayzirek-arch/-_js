import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

const OwnerPanel = () => {
  const { user } = useAuth();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.restaurant) {
      fetchDishes();
    }
  }, [user]);

  const fetchDishes = async () => {
    try {
      const q = query(collection(db, 'dishes'), where('restaurantId', '==', user.restaurant));
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

  const handleDelete = async (dishId) => {
    if (!window.confirm('Удалить блюдо?')) return;
    try {
      await deleteDoc(doc(db, 'dishes', dishId));
      setDishes(dishes.filter(d => d.id !== dishId));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  if (!user || user.role !== 'owner') {
    return <p>Доступ только для владельцев ресторанов</p>;
  }

  return (
    <div className="owner-panel">
      <h2>🍽️ Панель владельца</h2>
      <Link to="/add-dish">
        <button className="btn-add">+ Добавить блюдо</button>
      </Link>

      <h3>Мои блюда:</h3>
      {loading ? (
        <p>Загрузка...</p>
      ) : dishes.length === 0 ? (
        <p>Нет блюд. Добавьте первое!</p>
      ) : (
        <div className="dishes-grid">
          {dishes.map(dish => (
            <div key={dish.id} className="dish-card">
              <img 
                src={dish.image || '🍽️'} 
                alt={dish.name}
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <h4>{dish.name}</h4>
              <p>💰 {dish.price} сом</p>
              <p>📝 {dish.ingredients}</p>
              <button 
                onClick={() => handleDelete(dish.id)}
                className="btn-delete"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerPanel;