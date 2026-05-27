import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const defaultCategories = [
  { value: 'drinks', labelRu: 'Суусундуктар / Чайлар', labelKy: 'Суусундуктар / Чайлар' },
  { value: 'breakfast', labelRu: 'Таңкы тамактар', labelKy: 'Таңкы тамактар' },
  { value: 'firstCourse', labelRu: 'Биринчи тамактар', labelKy: 'Биринчи тамактар' },
  { value: 'secondCourse', labelRu: 'Экинчи тамактар', labelKy: 'Экинчи тамактар' },
  { value: 'salads', labelRu: 'Салаттар', labelKy: 'Салаттар' },
  { value: 'extras', labelRu: 'Кошумчалар', labelKy: 'Кошумчалар' }
];

const translations = {
  ru: {
    title: 'Добавить блюдо',
    name: 'Название блюда',
    price: 'Цена (сом)',
    ingredients: 'Ингредиенты',
    category: 'Раздел',
    selectCategory: 'Выберите раздел',
    image: 'Фото блюда (необязательно)',
    restaurant: 'Ресторан',
    selectRestaurant: 'Выберите ресторан',
    submit: 'Добавить блюдо',
    success: '✅ Блюдо успешно добавлено!',
    error: '❌ Ошибка: ',
    accessDenied: 'Доступ запрещён',
    newCategory: 'Новая категория',
    addCategory: '+ Добавить свою категорию',
    customCategory: 'Своя категория',
    orSelect: 'или выберите из списка'
  },
  ky: {
    title: 'Тамак кошуу',
    name: 'Тамактын аталышы',
    price: 'Баасы (сом)',
    ingredients: 'Ингредиенттер',
    category: 'Бөлүм',
    selectCategory: 'Бөлүм тандаңыз',
    image: 'Тамактын сүрөтү (кошумча)',
    restaurant: 'Ресторан',
    selectRestaurant: 'Ресторан тандаңыз',
    submit: 'Тамак кошуу',
    success: '✅ Тамак ийгиликтүү кошулду!',
    error: '❌ Ката: ',
    accessDenied: 'Кирүүгө уруксат жок',
    newCategory: 'Жаңы категория',
    addCategory: '+ Өз категорияңызды кошуу',
    customCategory: 'Өз категорияңыз',
    orSelect: 'же тизмеден тандаңыз'
  }
};

const AddDish = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [image, setImage] = useState(null);
  const [restaurant, setRestaurant] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState('');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [user]);

  const fetchRestaurants = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'restaurants'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(list);

      if (user?.role === 'owner' && user?.restaurant) {
        setRestaurant(user.restaurant);
        console.log('Owner restaurant set:', user.restaurant);
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Проверяем restaurantId
      const finalRestaurantId = user?.role === 'admin' ? restaurant : user?.restaurant;

      if (!finalRestaurantId) {
        setMessage(t.error + (lang === 'ru' ? 'Выберите ресторан' : 'Ресторан тандаңыз'));
        setLoading(false);
        return;
      }

      // Определяем категорию
      const finalCategory = showCustomCategory && customCategory ? customCategory : category;

      if (!finalCategory) {
        setMessage(t.error + (lang === 'ru' ? 'Выберите или введите категорию' : 'Категория тандаңыз же киргизиңиз'));
        setLoading(false);
        return;
      }

      let imageUrl = '';

      // Загружаем фото только если выбрано
      if (image) {
        try {
          const storageRef = ref(storage, `dishes/${Date.now()}_${image.name}`);
          await uploadBytes(storageRef, image);
          imageUrl = await getDownloadURL(storageRef);
        } catch (storageErr) {
          console.warn('Storage upload failed (CORS?), continuing without image:', storageErr);
          // Продолжаем без фото
        }
      }

      console.log('Adding dish:', {
        name,
        price: Number(price),
        ingredients,
        category: finalCategory,
        image: imageUrl,
        restaurantId: finalRestaurantId
      });

      await addDoc(collection(db, 'dishes'), {
        name,
        price: Number(price),
        ingredients,
        category: finalCategory,
        image: imageUrl,
        restaurantId: finalRestaurantId,
        createdAt: new Date().toISOString()
      });

      setMessage(t.success);
      setTimeout(() => {
        navigate(user?.role === 'owner' ? '/owner' : '/admin');
      }, 1500);
    } catch (err) {
      console.error('Error adding dish:', err);
      setMessage(t.error + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <p>{t.accessDenied}</p>;
  }

  return (
    <div className="add-dish-container">
      <h2>{t.title}</h2>
      {message && <p className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder={t.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input 
          type="number" 
          placeholder={t.price}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <textarea 
          placeholder={t.ingredients}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          required
        />

        {/* Выбор категории */}
        <div className="category-section">
          <label>{t.category}</label>

          {showCustomCategory ? (
            <>
              <input
                type="text"
                placeholder={t.customCategory}
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
              <button 
                type="button" 
                className="btn-link"
                onClick={() => { setShowCustomCategory(false); setCustomCategory(''); }}
              >
                {t.orSelect}
              </button>
            </>
          ) : (
            <>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t.selectCategory}</option>
                {defaultCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {lang === 'ru' ? cat.labelRu : cat.labelKy}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn-link"
                onClick={() => setShowCustomCategory(true)}
              >
                {t.addCategory}
              </button>
            </>
          )}
        </div>

        <div className="form-group">
          <label>{t.image}</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>

        {user.role === 'admin' ? (
          <select 
            value={restaurant} 
            onChange={(e) => setRestaurant(e.target.value)} 
            required
          >
            <option value="">{t.selectRestaurant}</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          <div className="form-group">
            <label>{t.restaurant}</label>
            <input 
              type="text" 
              value={restaurants.find(r => r.id === user?.restaurant)?.name || user?.restaurant || ''} 
              disabled 
              className="disabled-input"
            />
            <input type="hidden" value={restaurant} />
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '...' : t.submit}
        </button>
      </form>
    </div>
  );
};

export default AddDish;