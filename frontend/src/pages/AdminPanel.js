import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ orders: 0, users: 0, revenue: 0 });
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  // Загрузка данных
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Статистика
      const ordersRes = await axios.get('http://localhost:3001/api/orders/all');
      const usersRes = await axios.get('http://localhost:3001/api/auth/users'); // нужно добавить роут
      const restRes = await axios.get('http://localhost:3001/api/restaurants');
      
      const allOrders = ordersRes.data;
      const totalRevenue = allOrders.reduce((sum, o) => sum + o.finalAmount, 0);
      
      setStats({
        orders: allOrders.length,
        users: usersRes.data?.length || 0,
        revenue: totalRevenue
      });
      
      setOrders(allOrders);
      setUsers(usersRes.data || []);
      setRestaurants(restRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setLoading(false);
    }
  };

  // Создать ресторан
  const [newRest, setNewRest] = useState({ name: '', description: '' });
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/restaurants', newRest);
      setNewRest({ name: '', description: '' });
      fetchData();
      alert('✅ Ресторан создан!');
    } catch (err) {
      alert('❌ Ошибка: ' + (err.response?.data?.message || err.message));
    }
  };

  // Изменить статус заказа
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`http://localhost:3001/api/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Ошибка изменения статуса');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="admin-panel">
      <h1>🔧 Панель администратора</h1>
      
      {/* Навигация по вкладкам */}
      <div className="admin-tabs">
        <button 
          className={activeTab === 'stats' ? 'active' : ''} 
          onClick={() => setActiveTab('stats')}
        >
          📊 Статистика
        </button>
        <button 
          className={activeTab === 'restaurants' ? 'active' : ''} 
          onClick={() => setActiveTab('restaurants')}
        >
          🏪 Рестораны
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          📦 Заказы ({orders.length})
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          👥 Пользователи
        </button>
      </div>

      {/* Вкладка: Статистика */}
      {activeTab === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>📦 Заказов</h3>
            <p className="stat-number">{stats.orders}</p>
          </div>
          <div className="stat-card">
            <h3>👥 Пользователей</h3>
            <p className="stat-number">{stats.users}</p>
          </div>
          <div className="stat-card">
            <h3>💰 Доход</h3>
            <p className="stat-number">{stats.revenue} сом</p>
          </div>
        </div>
      )}

      {/* Вкладка: Рестораны */}
      {activeTab === 'restaurants' && (
        <div className="restaurants-section">
          <h2>Создать ресторан</h2>
          <form onSubmit={handleCreateRestaurant} className="admin-form">
            <input
              type="text"
              placeholder="Название ресторана"
              value={newRest.name}
              onChange={(e) => setNewRest({...newRest, name: e.target.value})}
              required
            />
            <textarea
              placeholder="Описание"
              value={newRest.description}
              onChange={(e) => setNewRest({...newRest, description: e.target.value})}
            />
            <button type="submit">+ Создать ресторан</button>
          </form>

          <h2>Все рестораны</h2>
          <div className="restaurants-list">
            {restaurants.map(r => (
              <div key={r._id} className="restaurant-item">
                <h4>{r.name}</h4>
                <p>{r.description}</p>
                <p>Владелец: {r.owner?.name || 'Не назначен'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Вкладка: Заказы */}
      {activeTab === 'orders' && (
        <div className="orders-section">
          <h2>Все заказы</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Тип</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td>{o._id?.slice(-6)}</td>
                  <td>{o.user?.name || '—'}</td>
                  <td>{o.finalAmount} сом</td>
                  <td>
                    <span className={`status-${o.status}`}>{o.status}</span>
                  </td>
                  <td>{o.orderType}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select 
                      value={o.status}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    >
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

      {/* Вкладка: Пользователи */}
      {activeTab === 'users' && (
        <div className="users-section">
          <h2>Все пользователи</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Накоплено</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{u.totalSpent} сом</td>
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