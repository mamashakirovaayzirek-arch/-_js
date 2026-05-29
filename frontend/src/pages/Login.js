import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const translations = {
  ru: {
    title: 'Вход',
    login: 'Логин или Email',
    password: 'Пароль',
    submit: 'Войти',
    noAccount: 'Нет аккаунта?',
    register: 'Зарегистрироваться',
    error: 'Ошибка входа',
    requestPending: 'Ваша заявка ещё на рассмотрении. Ожидайте подтверждения администратора.',
    requestRejected: 'Ваша заявка была отклонена. Обратитесь к администратору.',
    userNotFound: 'Пользователь не найден',
    invalidCredentials: 'Неверный логин или пароль'
  },
  ky: {
    title: 'Кирүү',
    login: 'Логин же Email',
    password: 'Сырсөз',
    submit: 'Кирүү',
    noAccount: 'Аккаунтуңуз жокпу?',
    register: 'Катталуу',
    error: 'Кирүү катасы',
    requestPending: 'Сиздин арызыңыз каралууда. Администратордун ырастоосун күтө туруңуз.',
    requestRejected: 'Сиздин арызыңыз четке кагылды. Администраторго кайрылыңыз.',
    userNotFound: 'Колдонуучу табылган жок',
    invalidCredentials: 'Туура эмес логин же сырсөз'
  }
};

const Login = () => {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'ru'; } catch(e) { return 'ru'; }
  });

  const t = translations[lang];

  useEffect(() => {
    const handleLangChange = () => setLang(() => {
      try { return localStorage.getItem('lang') || 'ru'; } catch(e) { return 'ru'; }
    });
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  // Находим email по логину ИЛИ возвращаем email если ввели email
  const findEmailByLogin = async (input) => {
    const inputLower = input.toLowerCase().trim();
    
    try {
      // Если ввели email (содержит @) — используем как есть
      if (inputLower.includes('@')) {
        // Проверяем заявку владельца по email
        const reqQ = query(collection(db, 'ownerRequests'), where('email', '==', inputLower));
        const reqSnap = await getDocs(reqQ);
        if (!reqSnap.empty) {
          const status = reqSnap.docs[0].data().status;
          if (status === 'pending') return { error: 'pending' };
          if (status === 'rejected') return { error: 'rejected' };
        }
        return { email: inputLower };
      }

      // Ищем по логину в users
      const q = query(collection(db, 'users'), where('login', '==', inputLower));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { email: snap.docs[0].data().email };
      }

      // Ищем по логину в ownerRequests
      const reqQ = query(collection(db, 'ownerRequests'), where('login', '==', inputLower));
      const reqSnap = await getDocs(reqQ);
      if (!reqSnap.empty) {
        const data = reqSnap.docs[0].data();
        if (data.status === 'pending') return { error: 'pending' };
        if (data.status === 'rejected') return { error: 'rejected' };
        return { email: data.email };
      }

      // Если ничего не нашли — возможно старый пользователь без логина
      // Пробуем найти по email (если ввели что-то похожее на email без @)
      const emailQ = query(collection(db, 'users'), where('email', '==', inputLower));
      const emailSnap = await getDocs(emailQ);
      if (!emailSnap.empty) {
        return { email: emailSnap.docs[0].data().email };
      }

      return null;
    } catch (e) {
      console.error('Ошибка поиска:', e);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!loginValue || !password) {
        setError(t.fillAllFields || 'Заполните все поля');
        return;
      }

      const result = await findEmailByLogin(loginValue);
      
      if (!result) {
        setError(t.userNotFound);
        return;
      }

      if (result.error === 'pending') {
        setError(t.requestPending);
        return;
      }

      if (result.error === 'rejected') {
        setError(t.requestRejected);
        return;
      }

      // Входим по email
      await login(result.email, password);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError(t.invalidCredentials);
      } else {
        setError(err.message || t.error);
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>{t.title}</h2>
      {error && <p className="error">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder={t.login}
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
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