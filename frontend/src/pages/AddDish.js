import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddDish = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [image, setImage] = useState(null);
  const [restaurant, setRestaurant] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    const snapshot = await getDocs(collection(db, 'restaurants'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRestaurants(list);
    if (user?.role === 'owner' && user?.restaurant) {
      setRestaurant(user.restaurant);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let imageUrl = '';
      if (image) {
        const storageRef = ref(storage, `dishes/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'dishes'), {
        name,
        price: Number(price),
        ingredients,
        image: imageUrl,
        restaurantId: restaurant,
        createdAt: new Date().toISOString()
      });

      setMessage('✅ Блюдо успешно добавлено!');
      setTimeout(() => navigate('/owner'), 1500);
    } catch (err) {
      setMessage('❌ Ошибка: ' + err.message);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <p>Доступ запрещён</p>;
  }

  return (
    <div className="add-dish-container">
      <h2>Добавить блюдо</h2>
      {message && <p className="message">{message}</p>}
      
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Название блюда" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <input 
          type="number" 
          placeholder="Цена (сом)" 
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        
        <textarea 
          placeholder="Ингредиенты" 
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          required
        />
        
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          required
        />
        
        {user.role === 'admin' ? (
          <select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} required>
            <option value="">Выберите ресторан</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          <input type="hidden" value={restaurant} />
        )}
        
        <button type="submit">Добавить блюдо</button>
      </form>
    </div>
  );
};

export default AddDish;