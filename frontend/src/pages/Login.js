import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const translations = {
  ru: {
    title: 'Вход',
    email: 'Email',
    password: 'Пароль',
    submit: 'Войти',
    error: 'Неверный email или пароль',
    noAccount: 'Нет аккаунта?',
    register: 'Зарегистрироваться'
  },
  ky: {
    title: 'Кирүү',
    email: 'Email',
    password: 'Сырсөз',
    submit: 'Кирүү',
    error: 'Email же сырсөз туура эмес',
    noAccount: 'Аккаунтуңуз жокпу?',
    register: 'Катталуу'
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(t.error);
    }
  };

  return (
    <div className="auth-container">
      <h2>{t.title}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">{t.submit}</button>
      </form>
      <p>{t.noAccount} <a href="/register">{t.register}</a></p>
    </div>
  );
};

export default Login;