import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ orders: 0, users: 0, revenue: 0 });
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Получаем заказы
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Получаем рестораны
      const restSnapshot = await getDocs(collection(db, 'restaurants'));
      const restList = restSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Получаем пользователей
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
      alert('✅ Ресторан создан!');
    } catch (err) {
      alert('❌ Ошибка: ' + err.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Ошибка изменения статуса');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="admin-panel">
      <h1>🔧 Панель администратора</h1>
      
      <div className="admin-tabs">
        <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>📊 Статистика</button>
        <button className={activeTab === 'restaurants' ? 'active' : ''} onClick={() => setActiveTab('restaurants')}>🏪 Рестораны</button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>📦 Заказы ({orders.length})</button>
      </div>

      {activeTab === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card"><h3>📦 Заказов</h3><p className="stat-number">{stats.orders}</p></div>
          <div className="stat-card"><h3>👥 Пользователей</h3><p className="stat-number">{stats.users}</p></div>
          <div className="stat-card"><h3>💰 Доход</h3><p className="stat-number">{stats.revenue} сом</p></div>
        </div>
      )}

      {activeTab === 'restaurants' && (
        <div className="restaurants-section">
          <h2>Создать ресторан</h2>
          <form onSubmit={handleCreateRestaurant} className="admin-form">
            <input type="text" placeholder="Название" value={newRest.name} onChange={(e) => setNewRest({...newRest, name: e.target.value})} required />
            <textarea placeholder="Описание" value={newRest.description} onChange={(e) => setNewRest({...newRest, description: e.target.value})} />
            <button type="submit">+ Создать</button>
          </form>
          <h2>Все рестораны</h2>
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
          <h2>Все заказы</h2>
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Клиент</th><th>Сумма</th><th>Статус</th><th>Тип</th><th>Дата</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{o.id?.slice(-6)}</td>
                  <td>{o.userName || '—'}</td>
                  <td>{o.finalAmount} сом</td>
                  <td><span className={`status-${o.status}`}>{o.status}</span></td>
                  <td>{o.orderType}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                      <option value="pending">Ожидание</option>
                      <option value="cooking">Готовится</option>
                      <option value="ready">Готов</option>
                      <option value="completed">Завершён</option>
                      <option value="cancelled">Отменён</option>
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