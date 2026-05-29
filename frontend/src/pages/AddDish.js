import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

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
    titleAdd: 'Добавить блюдо',
    titleEdit: 'Редактировать блюдо',
    name: 'Название блюда',
    price: 'Цена (сом)',
    ingredients: 'Ингредиенты (необязательно)',
    category: 'Раздел',
    selectCategory: 'Выберите раздел',
    image: 'Фото блюда',
    imageNote: 'Автоматическое сжатие',
    restaurant: 'Ресторан',
    selectRestaurant: 'Выберите ресторан',
    submitAdd: 'Добавить блюдо',
    submitEdit: 'Сохранить изменения',
    successAdd: '✅ Блюдо успешно добавлено!',
    successEdit: '✅ Блюдо успешно обновлено!',
    error: '❌ Ошибка: ',
    accessDenied: 'Доступ запрещён',
    newCategory: 'Новая категория',
    addCategory: '+ Добавить свою категорию',
    customCategory: 'Своя категория',
    orSelect: 'или выберите из списка',
    preview: 'Превью',
    compressing: 'Сжатие фото...',
    size: 'Размер'
  },
  ky: {
    titleAdd: 'Тамак кошуу',
    titleEdit: 'Тамакты өзгөртүү',
    name: 'Тамактын аталышы',
    price: 'Баасы (сом)',
    ingredients: 'Ингредиенттер (кошумча)',
    category: 'Бөлүм',
    selectCategory: 'Бөлүм тандаңыз',
    image: 'Тамактын сүрөтү',
    imageNote: 'Авто кыскартуу',
    restaurant: 'Ресторан',
    selectRestaurant: 'Ресторан тандаңыз',
    submitAdd: 'Тамак кошуу',
    submitEdit: 'Өзгөртүүлөрдү сактоо',
    successAdd: '✅ Тамак ийгиликтүү кошулду!',
    successEdit: '✅ Тамак ийгиликтүү жаңыланды!',
    error: '❌ Ката: ',
    accessDenied: 'Кирүүгө уруксат жок',
    newCategory: 'Жаңы категория',
    addCategory: '+ Өз категорияңызды кошуу',
    customCategory: 'Өз категорияңыз',
    orSelect: 'же тизмеден тандаңыз',
    preview: 'Алдын ала көрүү',
    compressing: 'Сүрөт кыскартылууда...',
    size: 'Өлчөмү'
  }
};

const AddDish = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = !!editId;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [imageBase64, setImageBase64] = useState('');
  const [imageSize, setImageSize] = useState(0);
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
    if (isEditMode) {
      fetchDishData();
    }
  }, [user, editId]);

  const fetchRestaurants = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'restaurants'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(list);

      // 🔥 НОВОЕ: для владельца ищем ресторан по ownerId напрямую из Firestore
      if (user?.role === 'owner') {
        // Сначала пробуем из user
        const fromUser = user?.restaurantId || user?.restaurant;
        if (fromUser) {
          setRestaurant(fromUser);
          return;
        }

        // Если нет в user — ищем в Firestore по ownerId
        const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
        const ownerRestaurants = await getDocs(q);
        if (!ownerRestaurants.empty) {
          const restId = ownerRestaurants.docs[0].id;
          setRestaurant(restId);
          console.log('Found restaurant by ownerId:', restId);
        } else {
          console.log('No restaurant found for owner:', user.uid);
        }
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    }
  };

  const fetchDishData = async () => {
    try {
      const dishDoc = await getDoc(doc(db, 'dishes', editId));
      if (dishDoc.exists()) {
        const data = dishDoc.data();
        setName(data.name || '');
        setPrice(data.price || '');
        setIngredients(data.ingredients || '');
        setCategory(data.category || '');
        setImageBase64(data.image || '');
        if (data.image) {
          setImageSize(Math.round(data.image.length / 1024));
        }
        setRestaurant(data.restaurantId || '');
      }
    } catch (err) {
      console.error('Error fetching dish:', err);
    }
  };

  const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7, maxSizeKB = 400) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let currentQuality = quality;
          let result = canvas.toDataURL('image/jpeg', currentQuality);
          
          while (result.length > maxSizeKB * 1024 * 1.37 && (maxWidth > 200 || maxHeight > 200)) {
            maxWidth *= 0.8;
            maxHeight *= 0.8;
            canvas.width = maxWidth;
            canvas.height = maxHeight;
            ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
            result = canvas.toDataURL('image/jpeg', currentQuality);
          }

          resolve(result);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage(t.error + (lang === 'ru' ? 'Только изображения' : 'Сүрөт гана'));
      return;
    }

    setLoading(true);
    setMessage(t.compressing);
    
    try {
      const resized = await resizeImage(file);
      setImageBase64(resized);
      setImageSize(Math.round(resized.length / 1024));
      setMessage('');
    } catch (err) {
      setMessage(t.error + (lang === 'ru' ? 'Ошибка обработки фото' : 'Сүрөттү иштетүүдө ката'));
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 🔥 НОВОЕ: для владельца ищем ресторан по ownerId напрямую
      let finalRestaurantId = user?.role === 'admin' ? restaurant : (user?.restaurantId || user?.restaurant);

      // Если всё ещё нет — ищем в Firestore
      if (!finalRestaurantId && user?.role === 'owner') {
        const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
        const ownerRestaurants = await getDocs(q);
        if (!ownerRestaurants.empty) {
          finalRestaurantId = ownerRestaurants.docs[0].id;
        }
      }

      if (!finalRestaurantId) {
        setMessage(t.error + (lang === 'ru' ? 'Ресторан не привязан к аккаунту' : 'Ресторан аккаунтка байланган эмес'));
        setLoading(false);
        return;
      }

      const finalCategory = showCustomCategory && customCategory ? customCategory : category;

      if (!finalCategory) {
        setMessage(t.error + (lang === 'ru' ? 'Выберите или введите категорию' : 'Категория тандаңыз же киргизиңиз'));
        setLoading(false);
        return;
      }

      const dishData = {
        name,
        price: Number(price),
        ingredients: ingredients || '',
        category: finalCategory,
        image: imageBase64 || '',
        restaurantId: finalRestaurantId,
        updatedAt: new Date().toISOString()
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'dishes', editId), dishData);
        setMessage(t.successEdit);
      } else {
        dishData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'dishes'), dishData);
        setMessage(t.successAdd);
      }

      setTimeout(() => {
        navigate(user?.role === 'owner' ? '/owner' : '/admin');
      }, 1500);
    } catch (err) {
      console.error('Error saving dish:', err);
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
      <h2>{isEditMode ? t.titleEdit : t.titleAdd}</h2>
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
        />

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
          <small style={{color: '#888', marginBottom: '5px', display: 'block'}}>{t.imageNote}</small>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageChange}
          />
          {imageBase64 && (
            <div className="image-preview">
              <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                {t.preview} ({t.size}: {imageSize} KB):
              </p>
              <img 
                src={imageBase64} 
                alt="Preview" 
                style={{maxWidth: '200px', maxHeight: '200px', borderRadius: '10px', marginTop: '5px'}}
              />
            </div>
          )}
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
              value={restaurants.find(r => r.id === restaurant)?.name || restaurant || 'НЕ ПРИВЯЗАН'} 
              disabled 
              className="disabled-input"
            />
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '...' : (isEditMode ? t.submitEdit : t.submitAdd)}
        </button>
      </form>
    </div>
  );
};

export default AddDish;