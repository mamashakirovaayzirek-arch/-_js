import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

const translations = {
  ru: {
    title: '🔧 Панель администратора',
    stats: '📊 Статистика',
    restaurants: '🏪 Рестораны',
    orders: '📦 Заказы',
    ordersCount: 'Заказов',
    users: '👥 Пользователей',
    revenue: '💰 Доход',
    createRestaurant: 'Создать ресторан',
    name: 'Название',
    description: 'Описание',
    create: '+ Создать',
    allRestaurants: 'Все рестораны',
    allOrders: 'Все заказы',
    id: 'ID',
    client: 'Клиент',
    amount: 'Сумма',
    status: 'Статус',
    type: 'Тип',
    date: 'Дата',
    actions: 'Действия',
    loading: 'Загрузка...',
    statusOptions: {
      pending: 'Ожидание',
      cooking: 'Готовится',
      ready: 'Готов',
      completed: 'Завершён',
      cancelled: 'Отменён'
    }
  },
  ky: {
    title: '🔧 Администратор панели',
    stats: '📊 Статистика',
    restaurants: '🏪 Ресторандар',
    orders: '📦 Буйрутмалар',
    ordersCount: 'Буйрутмалар',
    users: '👥 Колдонуучулар',
    revenue: '💰 Киреше',
    createRestaurant: 'Ресторан түзүү',
    name: 'Аталышы',
    description: 'Сүрөттөмөсү',
    create: '+ Түзүү',
    allRestaurants: 'Бардык ресторандар',
    allOrders: 'Бардык буйрутмалар',
    id: 'ID',
    client: 'Кардар',
    amount: 'Сумма',
    status: 'Статус',
    type: 'Түрү',
    date: 'Дата',
    actions: 'Аракеттер',
    loading: 'Жүктөлүүдө...',
    statusOptions: {
      pending: 'Күтүүдө',
      cooking: 'Даярдалууда',
      ready: 'Даяр',
      completed: 'Аяктады',
      cancelled: 'Жокко чыгарылды'
    }
  }
};

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, users: 0, revenue: 0 });
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const t = translations[lang];

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'ru');
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const restSnapshot = await getDocs(collection(db, 'restaurants'));
      const restList = restSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalRevenue = ordersList.reduce((sum, o) => sum + (o.finalAmount || 0), 0);

      setStats({
        orders: ordersList.length,
        users: usersList.length,
        revenue: totalRevenue
      });

      setOrders(ordersList);
      setRestaurants(restList);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setLoading(false);
    }
  };

  const [newRest, setNewRest] = useState({ name: '', description: '' });
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'restaurants'), {
        ...newRest,
        createdAt: new Date().toISOString()
      });
      setNewRest({ name: '', description: '' });
      fetchData();
      alert(lang === 'ru' ? '✅ Ресторан создан!' : '✅ Ресторан түзүлдү!');
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      fetchData();
    } catch (err) {
      alert(lang === 'ru' ? 'Ошибка изменения статуса' : 'Статус өзгөртүү катасы');
    }
  };

  if (loading) return <div className="loading">{t.loading}</div>;

  return (
    <div className="admin-panel">
      <h1>{t.title}</h1>

      <div className="admin-tabs">
        <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>{t.stats}</button>
        <button className={activeTab === 'restaurants' ? 'active' : ''} onClick={() => setActiveTab('restaurants')}>{t.restaurants}</button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>{t.orders} ({orders.length})</button>
      </div>

      {activeTab === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card"><h3>📦 {t.ordersCount}</h3><p className="stat-number">{stats.orders}</p></div>
          <div className="stat-card"><h3>👥 {t.users}</h3><p className="stat-number">{stats.users}</p></div>
          <div className="stat-card"><h3>💰 {t.revenue}</h3><p className="stat-number">{stats.revenue} сом</p></div>
        </div>
      )}

      {activeTab === 'restaurants' && (
        <div className="restaurants-section">
          <h2>{t.createRestaurant}</h2>
          <form onSubmit={handleCreateRestaurant} className="admin-form">
            <input type="text" placeholder={t.name} value={newRest.name} onChange={(e) => setNewRest({...newRest, name: e.target.value})} required />
            <textarea placeholder={t.description} value={newRest.description} onChange={(e) => setNewRest({...newRest, description: e.target.value})} />
            <button type="submit">{t.create}</button>
          </form>
          <h2>{t.allRestaurants}</h2>
          <div className="restaurants-list">
            {restaurants.map(r => (
              <div key={r.id} className="restaurant-item">
                <h4>{r.name}</h4>
                <p>{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="orders-section">
          <h2>{t.allOrders}</h2>
          <table className="admin-table">
            <thead>
              <tr><th>{t.id}</th><th>{t.client}</th><th>{t.amount}</th><th>{t.status}</th><th>{t.type}</th><th>{t.date}</th><th>{t.actions}</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{o.id?.slice(-6)}</td>
                  <td>{o.userName || '—'}</td>
                  <td>{o.finalAmount} сом</td>
                  <td><span className={`status-${o.status}`}>{t.statusOptions[o.status] || o.status}</span></td>
                  <td>{o.orderType}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                      <option value="pending">{t.statusOptions.pending}</option>
                      <option value="cooking">{t.statusOptions.cooking}</option>
                      <option value="ready">{t.statusOptions.ready}</option>
                      <option value="completed">{t.statusOptions.completed}</option>
                      <option value="cancelled">{t.statusOptions.cancelled}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;