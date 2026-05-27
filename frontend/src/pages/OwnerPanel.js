import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, deleteDoc, doc, addDoc } from 'firebase/firestore';

const translations = {
  ru: {
    title: '🍽️ Панель владельца',
    addDish: '+ Добавить блюдо',
    myDishes: 'Мои блюда:',
    loading: 'Загрузка...',
    noDishes: 'Нет блюд. Добавьте первое!',
    delete: 'Удалить',
    price: 'сом',
    ingredients: 'Ингредиенты',
    accessDenied: 'Доступ только для владельцев ресторанов',
    categories: 'Категории',
    addCategory: '+ Добавить категорию',
    categoryName: 'Название категории',
    myCategories: 'Мои категории',
    noCategories: 'Нет категорий'
  },
  ky: {
    title: '🍽️ Ресторан ээсинин панели',
    addDish: '+ Тамак кошуу',
    myDishes: 'Менин тамактарым:',
    loading: 'Жүктөлүүдө...',
    noDishes: 'Тамак жок. Биринчисин кошуңуз!',
    delete: 'Өчүрүү',
    price: 'сом',
    ingredients: 'Ингредиенттер',
    accessDenied: 'Ресторан ээлери үчүн гана',
    categories: 'Категориялар',
    addCategory: '+ Категория кошуу',
    categoryName: 'Категориянын аталышы',
    myCategories: 'Менин категорияларым',
    noCategories: 'Категория жок'
  }
};

const OwnerPanel = () => {
  const { user } = useAuth();
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  useEffect(() => {
    if (user?.restaurant) {
      fetchDishes();
      fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), where('restaurantId', '==', user.restaurant));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(list);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory.trim(),
        restaurantId: user.restaurant,
        createdAt: new Date().toISOString()
      });
      setNewCategory('');
      setShowCategoryForm(false);
      fetchCategories();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleDelete = async (dishId) => {
    if (!window.confirm(lang === 'ru' ? 'Удалить блюдо?' : 'Тамакты өчүрүү?')) return;
    try {
      await deleteDoc(doc(db, 'dishes', dishId));
      setDishes(dishes.filter(d => d.id !== dishId));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  if (!user || user.role !== 'owner') {
    return <p>{t.accessDenied}</p>;
  }

  return (
    <div className="owner-panel">
      <h2>{t.title}</h2>

      <div className="owner-actions">
        <Link to="/add-dish">
          <button className="btn-add">{t.addDish}</button>
        </Link>
        <button className="btn-add" onClick={() => setShowCategoryForm(!showCategoryForm)}>
          {t.addCategory}
        </button>
      </div>

      {showCategoryForm && (
        <form onSubmit={handleAddCategory} className="category-form">
          <input
            type="text"
            placeholder={t.categoryName}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
          />
          <button type="submit">{t.addCategory}</button>
        </form>
      )}

      {categories.length > 0 && (
        <div className="categories-section">
          <h3>{t.myCategories}</h3>
          <div className="categories-list">
            {categories.map(cat => (
              <span key={cat.id} className="category-tag">{cat.name}</span>
            ))}
          </div>
        </div>
      )}

      <h3>{t.myDishes}</h3>
      {loading ? (
        <p>{t.loading}</p>
      ) : dishes.length === 0 ? (
        <p>{t.noDishes}</p>
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
              <p>💰 {dish.price} {t.price}</p>
              <p>📝 {dish.ingredients}</p>
              <button 
                onClick={() => handleDelete(dish.id)}
                className="btn-delete"
              >
                {t.delete}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerPanel;