import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const translations = {
  ru: {
    title: 'Регистрация',
    name: 'Имя',
    email: 'Email',
    password: 'Пароль',
    role: 'Роль',
    customer: 'Клиент',
    owner: 'Владелец ресторана',
    admin: 'Администратор',
    restaurant: 'Выберите ресторан',
    selectRestaurant: 'Выберите ресторан',
    submit: 'Зарегистрироваться',
    hasAccount: 'Уже есть аккаунт?',
    login: 'Войти',
    error: 'Ошибка регистрации'
  },
  ky: {
    title: 'Катталуу',
    name: 'Аты',
    email: 'Email',
    password: 'Сырсөз',
    role: 'Ролу',
    customer: 'Кардар',
    owner: 'Ресторан ээси',
    admin: 'Администратор',
    restaurant: 'Ресторан тандаңыз',
    selectRestaurant: 'Ресторан тандаңыз',
    submit: 'Катталуу',
    hasAccount: 'Аккаунтуңуз барбы?',
    login: 'Кирүү',
    error: 'Катталуу катасы'
  }
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [restaurant, setRestaurant] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  useEffect(() => {
    if (role === 'owner') {
      fetchRestaurants();
    }
  }, [role]);

  const fetchRestaurants = async () => {
    const snapshot = await getDocs(collection(db, 'restaurants'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRestaurants(list);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (role === 'owner' && !restaurant) {
        setError(lang === 'ru' ? 'Выберите ресторан' : 'Ресторан тандаңыз');
        return;
      }
      await register(name, email, password, role, role === 'owner' ? restaurant : null);
      navigate('/');
    } catch (err) {
      setError(err.message || t.error);
    }
  };

  return (
    <div className="auth-container">
      <h2>{t.title}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder={t.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input 
          type="email" 
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder={t.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="customer">{t.customer}</option>
          <option value="owner">{t.owner}</option>
          <option value="admin">{t.admin}</option>
        </select>

        {role === 'owner' && (
          <select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} required>
            <option value="">{t.selectRestaurant}</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}

        <button type="submit">{t.submit}</button>
      </form>
      <p>{t.hasAccount} <a href="/login">{t.login}</a></p>
    </div>
  );
};

export default Register;