import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';

function OwnerPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [restaurantId, setRestaurantId] = useState(null);
  const [error, setError] = useState(null);

  // Загружаем restaurantId из user (уже есть в контексте!)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // restaurantId уже есть в user из AuthContext!
    const rid = user.restaurantId || user.uid;
    setRestaurantId(rid);
  }, [user]);

  // Загружаем блюда и категории
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const dishesQuery = query(
          collection(db, 'dishes'),
          where('restaurantId', '==', restaurantId)
        );
        const dishesSnapshot = await getDocs(dishesQuery);
        const dishesList = dishesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDishes(dishesList);

        const catQuery = query(
          collection(db, 'categories'),
          where('restaurantId', '==', restaurantId)
        );
        const catSnapshot = await getDocs(catQuery);
        const catList = catSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(catList);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantId]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim() || !restaurantId) {
      alert('Введите название категории');
      return;
    }

    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory.trim(),
        restaurantId: restaurantId,
        createdAt: new Date().toISOString()
      });
      setNewCategory('');
      alert('Категория добавлена!');
      
      // Перезагружаем категории
      const catQuery = query(
        collection(db, 'categories'),
        where('restaurantId', '==', restaurantId)
      );
      const catSnapshot = await getDocs(catQuery);
      const catList = catSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(catList);
    } catch (err) {
      console.error('Ошибка добавления категории:', err);
      alert('Ошибка: ' + err.message);
    }
  };

  const handleDeleteDish = async (dishId) => {
    if (!window.confirm('Удалить блюдо?')) return;
    try {
      await deleteDoc(doc(db, 'dishes', dishId));
      setDishes(dishes.filter(d => d.id !== dishId));
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  const handleToggleAvailability = async (dishId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'dishes', dishId), {
        available: !currentStatus
      });
      setDishes(dishes.map(d => 
        d.id === dishId ? { ...d, available: !currentStatus } : d
      ));
    } catch (err) {
      console.error('Ошибка обновления:', err);
    }
  };

  if (!user) {
    return (
      <div className="owner-panel">
        <h2>🏪 Панель владельца</h2>
        <p>Вы не авторизованы. <button onClick={() => navigate('/login')}>Войти</button></p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="owner-panel">
        <h2>🏪 Панель владельца</h2>
        <p>Загрузка...</p>
        {error && <p style={{color: 'red'}}>Ошибка: {error}</p>}
      </div>
    );
  }

  return (
    <div className="owner-panel">
      <h2>🏪 Панель владельца</h2>
      
      <div className="owner-actions">
        <button 
          className="btn-primary"
          onClick={() => navigate('/add-dish')}
        >
          + Добавить блюдо
        </button>
      </div>

      <div className="category-section">
        <h3>Категории</h3>
        <form onSubmit={handleAddCategory} className="category-form">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Новая категория"
            className="input-field"
          />
          <button type="submit" className="btn-secondary">
            + Добавить категорию
          </button>
        </form>

        {categories.length > 0 && (
          <div className="categories-list">
            {categories.map(cat => (
              <span key={cat.id} className="category-tag">
                {cat.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="dishes-section">
        <h3>Мои блюда</h3>
        {dishes.length === 0 ? (
          <p className="empty-state">Пока нет блюд</p>
        ) : (
          <div className="dishes-grid">
            {dishes.map(dish => (
              <div key={dish.id} className={`dish-card ${!dish.available ? 'unavailable' : ''}`}>
                {dish.image && (
                  <img src={dish.image} alt={dish.name} className="dish-image" />
                )}
                <div className="dish-info">
                  <h4>{dish.name}</h4>
                  <p className="dish-price">{dish.price} сом</p>
                  <p className="dish-category">{dish.category}</p>
                  <div className="dish-actions">
                    <button 
                      onClick={() => navigate(`/edit-dish/${dish.id}`)}
                      className="btn-edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleToggleAvailability(dish.id, dish.available)}
                      className={dish.available ? 'btn-disable' : 'btn-enable'}
                    >
                      {dish.available ? '⏸️' : '▶️'}
                    </button>
                    <button 
                      onClick={() => handleDeleteDish(dish.id)}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerPanel;