import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    // Получаем список ресторанов
    axios.get('http://localhost:3001/api/restaurants')
      .then(res => {
        setRestaurants(res.data);
        // Если owner — автоматически выбираем его ресторан
        if (user?.role === 'owner' && user?.restaurant) {
          setRestaurant(user.restaurant);
        }
      });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('ingredients', ingredients);
    formData.append('restaurant', restaurant);
    if (image) formData.append('image', image);

    try {
      await axios.post('http://localhost:3001/api/dishes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Блюдо успешно добавлено!');
      setTimeout(() => navigate('/owner'), 1500);
    } catch (err) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || err.message));
    }
  };

  // Только admin и owner могут добавлять
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
        
        {/* Выбор ресторана (только для admin, owner видит только свой) */}
        {user.role === 'admin' ? (
          <select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} required>
            <option value="">Выберите ресторан</option>
            {restaurants.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
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