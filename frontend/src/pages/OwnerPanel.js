import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const OwnerPanel = () => {
  const { user } = useAuth();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.restaurant) {
      axios.get(`http://localhost:3001/api/dishes/restaurant/${user.restaurant}`)
        .then(res => {
          setDishes(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  const handleDelete = async (dishId) => {
    if (!window.confirm('Удалить блюдо?')) return;
    try {
      await axios.delete(`http://localhost:3001/api/dishes/${dishId}`);
      setDishes(dishes.filter(d => d._id !== dishId));
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
            <div key={dish._id} className="dish-card">
              <img 
                src={`http://localhost:3001${dish.image}`} 
                alt={dish.name}
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <h4>{dish.name}</h4>
              <p>💰 {dish.price} сом</p>
              <p>📝 {dish.ingredients}</p>
              <button 
                onClick={() => handleDelete(dish._id)}
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