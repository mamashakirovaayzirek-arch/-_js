import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

const translations = {
  ru: {
    title: 'Регистрация',
    name: 'Имя',
    login: 'Логин',
    email: 'Email',
    password: 'Пароль',
    phone: 'Телефон',
    role: 'Роль',
    customer: 'Клиент',
    owner: 'Владелец ресторана',
    restaurantName: 'Название ресторана',
    restaurantAddress: 'Адрес ресторана',
    submit: 'Зарегистрироваться',
    hasAccount: 'Уже есть аккаунт?',
    loginLink: 'Войти',
    error: 'Ошибка регистрации',
    ownerRequestSent: '✅ Заявка отправлена! Ожидайте подтверждения администратора.',
    ownerRequestTitle: 'Заявка на регистрацию владельца',
    ownerRequestDesc: 'Ваша заявка будет рассмотрена администратором в течение 24 часов.',
    fillAllFields: 'Заполните все поля',
    userExists: 'Пользователь с таким логином уже существует',
    loginTaken: 'Этот логин уже занят',
    requestExists: 'Заявка с таким email уже отправлена. Ожидайте подтверждения.',
    checking: 'Проверка...'
  },
  ky: {
    title: 'Катталуу',
    name: 'Аты',
    login: 'Логин',
    email: 'Email',
    password: 'Сырсөз',
    phone: 'Телефон',
    role: 'Ролу',
    customer: 'Кардар',
    owner: 'Ресторан ээси',
    restaurantName: 'Ресторандын аталышы',
    restaurantAddress: 'Ресторандын дареги',
    submit: 'Катталуу',
    hasAccount: 'Аккаунтуңуз барбы?',
    loginLink: 'Кирүү',
    error: 'Катталуу катасы',
    ownerRequestSent: '✅ Арыз жиберилди! Администратордун ырастоосун күтө туруңуз.',
    ownerRequestTitle: 'Ээси катталуу арызы',
    ownerRequestDesc: 'Сиздин арызыңыз 24 саат ичинде администратор тарабынан каралат.',
    fillAllFields: 'Бардык талааларды толтуруңуз',
    userExists: 'Мындай логин бар колдонуучу бар',
    loginTaken: 'Бул логин ээләнген',
    requestExists: 'Мындай email менен арыз жиберилген. Ырастоону күтө туруңуз.',
    checking: 'Текшерүү...'
  }
};

const Register = () => {
  const [name, setName] = useState('');
  const [loginValue, setLoginValue] = useState(''); // Логин
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const { register } = useAuth();
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

  // Проверка существующего логина
  const checkLoginExists = async (loginToCheck) => {
    try {
      const q = query(collection(db, 'users'), where('login', '==', loginToCheck.toLowerCase()));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      return false;
    }
  };

  // Проверка существующей заявки
  const checkOwnerRequestExists = async (emailToCheck) => {
    try {
      const q = query(
        collection(db, 'ownerRequests'), 
        where('email', '==', emailToCheck.toLowerCase()),
        where('status', 'in', ['pending', 'approved'])
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setChecking(true);

    try {
      if (!name || !loginValue || !email || !password) {
        setError(t.fillAllFields);
        setChecking(false);
        return;
      }

      // Проверяем логин
      const loginExists = await checkLoginExists(loginValue);
      if (loginExists) {
        setError(t.loginTaken);
        setChecking(false);
        return;
      }

      if (role === 'owner') {
        if (!restaurantName || !phone) {
          setError(t.fillAllFields);
          setChecking(false);
          return;
        }

        const requestExists = await checkOwnerRequestExists(email);
        if (requestExists) {
          setError(t.requestExists);
          setChecking(false);
          return;
        }

        await addDoc(collection(db, 'ownerRequests'), {
          name,
          login: loginValue.toLowerCase(),
          email: email.toLowerCase(),
          phone,
          restaurantName,
          restaurantAddress,
          password: password,
          status: 'pending',
          createdAt: new Date().toISOString(),
          lang
        });

        setSuccess(true);
        setChecking(false);
        return;
      }

      // Обычная регистрация
      await register(name, loginValue, email, password, role);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t.userExists);
      } else {
        setError(err.message || t.error);
      }
    }
    setChecking(false);
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="success-message" style={{
          background: 'linear-gradient(135deg, #4CAF50, #45a049)',
          color: 'white',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <h2>🎉 {t.ownerRequestTitle}</h2>
          <p style={{ fontSize: '18px', margin: '15px 0' }}>{t.ownerRequestSent}</p>
          <p style={{ opacity: 0.9 }}>{t.ownerRequestDesc}</p>
          <button 
            onClick={() => navigate('/login')}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              border: 'none',
              borderRadius: '25px',
              background: 'white',
              color: '#4CAF50',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {t.loginLink}
          </button>
        </div>
      </div>
    );
  }

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
          type="text" 
          placeholder={t.login}
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
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
        <input 
          type="tel" 
          placeholder={t.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="customer">{t.customer}</option>
          <option value="owner">{t.owner}</option>
        </select>

        {role === 'owner' && (
          <div className="owner-fields" style={{
            background: '#fff3e0',
            padding: '15px',
            borderRadius: '10px',
            margin: '10px 0'
          }}>
            <h4 style={{ color: '#FF6B35', marginBottom: '10px' }}>
              {lang === 'ru' ? 'Данные ресторана' : 'Ресторан маалыматы'}
            </h4>
            <input 
              type="text" 
              placeholder={t.restaurantName}
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
            />
            <input 
              type="text" 
              placeholder={t.restaurantAddress}
              value={restaurantAddress}
              onChange={(e) => setRestaurantAddress(e.target.value)}
            />
          </div>
        )}

        <button type="submit" disabled={checking}>
          {checking ? t.checking : (role === 'owner' 
            ? (lang === 'ru' ? 'Отправить заявку' : 'Арыз жиберүү') 
            : t.submit
          )}
        </button>
      </form>
      
      <p>{t.hasAccount} <a href="/login">{t.loginLink}</a></p>
    </div>
  );
};

export default Register;