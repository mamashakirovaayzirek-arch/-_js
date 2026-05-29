// AdminPanel.js — Полноценная админ-панель OshMenu
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user, approveOwner, rejectOwner } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('oshmenu-lang') || 'ru'; } catch(e) { return 'ru'; }
  });

  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]); // Владельцы для выбора
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalDishes: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingRequests: 0
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', nameRu: '', nameKy: '', icon: '' });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    category: '',
    description: '',
    address: '',
    imageBase64: '',
    ownerId: '',
    ownerName: '',
    ownerEmail: ''
  });

  const t = {
    ru: {
      title: 'Админ-панель',
      dashboard: 'Дашборд',
      users: 'Пользователи',
      restaurants: 'Рестораны',
      dishes: 'Блюда',
      orders: 'Заказы',
      requests: 'Заявки владельцев',
      categories: 'Категории',
      totalUsers: 'Всего пользователей',
      totalRestaurants: 'Всего ресторанов',
      totalDishes: 'Всего блюд',
      totalOrders: 'Всего заказов',
      totalRevenue: 'Общая выручка',
      pendingRequests: 'Ожидают одобрения',
      som: 'сом',
      block: 'Заблокировать',
      unblock: 'Разблокировать',
      changeRole: 'Изменить роль',
      delete: 'Удалить',
      edit: 'Редактировать',
      view: 'Просмотр',
      approve: 'Одобрить',
      reject: 'Отклонить',
      status: 'Статус',
      active: 'Активен',
      blocked: 'Заблокирован',
      role: 'Роль',
      customer: 'Клиент',
      owner: 'Владелец',
      admin: 'Админ',
      pending: 'Ожидает',
      name: 'Имя',
      email: 'Email',
      phone: 'Телефон',
      createdAt: 'Дата регистрации',
      restaurantName: 'Название ресторана',
      description: 'Описание',
      address: 'Адрес',
      price: 'Цена',
      category: 'Категория',
      quantity: 'Количество',
      total: 'Итого',
      orderDate: 'Дата заказа',
      customerInfo: 'Информация о клиенте',
      orderItems: 'Состав заказа',
      newCategory: 'Новая категория',
      newRestaurant: 'Новый ресторан',
      addRestaurant: 'Добавить ресторан',
      editRestaurant: 'Редактировать ресторан',
      save: 'Сохранить',
      cancel: 'Отмена',
      confirmDelete: 'Вы уверены, что хотите удалить?',
      noData: 'Нет данных',
      loading: 'Загрузка...',
      logout: 'Выйти',
      actions: 'Действия',
      selectImage: 'Выбрать фото',
      changeImage: 'Изменить фото',
      owner: 'Владелец',
      selectOwner: 'Выберите владельца',
      noOwners: 'Нет владельцев. Сначала зарегистрируйте или одобрите заявку владельца.'
    },
    ky: {
      title: 'Админ панели',
      dashboard: 'Дашборд',
      users: 'Колдонуучулар',
      restaurants: 'Ресторандар',
      dishes: 'Тамактар',
      orders: 'Буйрутмалар',
      requests: 'Ээлердин арыздары',
      categories: 'Категориялар',
      totalUsers: 'Бардык колдонуучулар',
      totalRestaurants: 'Бардык ресторандар',
      totalDishes: 'Бардык тамактар',
      totalOrders: 'Бардык буйрутмалар',
      totalRevenue: 'Жалпы киреше',
      pendingRequests: 'Бекитүүнү күтүүдө',
      som: 'сом',
      block: 'Блоктоо',
      unblock: 'Блоктон чыгаруу',
      changeRole: 'Ролду өзгөртүү',
      delete: 'Өчүрүү',
      edit: 'Түзөтүү',
      view: 'Көрүү',
      approve: 'Бекитүү',
      reject: 'Четке кагуу',
      status: 'Статус',
      active: 'Активдүү',
      blocked: 'Блоктолгон',
      role: 'Роль',
      customer: 'Кардар',
      owner: 'Ээси',
      admin: 'Админ',
      pending: 'Күтүүдө',
      name: 'Аты',
      email: 'Email',
      phone: 'Телефон',
      createdAt: 'Катталган күнү',
      restaurantName: 'Ресторандын аты',
      description: 'Сүрөттөмө',
      address: 'Дарек',
      price: 'Баасы',
      category: 'Категория',
      quantity: 'Саны',
      total: 'Жыйынтыгы',
      orderDate: 'Буйрутма күнү',
      customerInfo: 'Кардар маалыматы',
      orderItems: 'Буйрутма курамы',
      newCategory: 'Жаңы категория',
      newRestaurant: 'Жаңы ресторан',
      addRestaurant: 'Ресторан кошуу',
      editRestaurant: 'Ресторанды түзөтүү',
      save: 'Сактоо',
      cancel: 'Баш тартуу',
      confirmDelete: 'Өчүрүүнү каалайсызбы?',
      noData: 'Маалымат жок',
      loading: 'Жүктөлүүдө...',
      logout: 'Чыгуу',
      actions: 'Аракеттер',
      selectImage: 'Сүрөт тандаңыз',
      changeImage: 'Сүрөттү алмаштыруу',
      owner: 'Ээси',
      selectOwner: 'Ээси тандаңыз',
      noOwners: 'Ээлери жок. Алгач ээни каттатыңыз же арызын бекитиңиз.'
    }
  };

  const txt = t[language];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadOwners(),
        loadRestaurants(),
        loadDishes(),
        loadOrders(),
        loadOwnerRequests(),
        loadCategories()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setUsers(data);
    setStats(prev => ({ ...prev, totalUsers: data.length }));
  };

  const loadOwners = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'owner'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setOwners(data);
  };

  const loadRestaurants = async () => {
    const snap = await getDocs(collection(db, 'restaurants'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setRestaurants(data);
    setStats(prev => ({ ...prev, totalRestaurants: data.length }));
  };

  const loadDishes = async () => {
    const snap = await getDocs(collection(db, 'dishes'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setDishes(data);
    setStats(prev => ({ ...prev, totalDishes: data.length }));
  };

  const loadOrders = async () => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setOrders(data);
    const revenue = data.reduce((sum, o) => sum + (o.total || 0), 0);
    setStats(prev => ({ ...prev, totalOrders: data.length, totalRevenue: revenue }));
  };

  const loadOwnerRequests = async () => {
    const q = query(collection(db, 'ownerRequests'), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setOwnerRequests(data);
    setStats(prev => ({ ...prev, pendingRequests: data.length }));
  };

  const loadCategories = async () => {
    const snap = await getDocs(collection(db, 'categories'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCategories(data);
  };

  // ===== IMAGE HANDLER =====
  const handleRestaurantImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'ru' ? 'Фото должно быть меньше 2MB' : 'Сүрөт 2MBдан кичине болушу керек');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setRestaurantForm(prev => ({ ...prev, imageBase64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ===== RESTAURANT ACTIONS =====
  const openNewRestaurant = () => {
    setRestaurantForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      category: '',
      description: '',
      address: '',
      imageBase64: '',
      ownerId: '',
      ownerName: '',
      ownerEmail: ''
    });
    setShowRestaurantModal(true);
  };

  const openEditRestaurant = (rest) => {
    setRestaurantForm({
      id: rest.id,
      name: rest.name || '',
      email: rest.email || '',
      phone: rest.phone || '',
      category: rest.category || '',
      description: rest.description || '',
      address: rest.address || '',
      imageBase64: rest.imageBase64 || '',
      ownerId: rest.ownerId || '',
      ownerName: rest.ownerName || '',
      ownerEmail: rest.ownerEmail || ''
    });
    setShowRestaurantModal(true);
  };

  const saveRestaurant = async () => {
    if (!restaurantForm.name) {
      alert(language === 'ru' ? 'Введите название ресторана' : 'Ресторандын атын киргизиңиз');
      return;
    }
    
    if (!restaurantForm.ownerId) {
      alert(language === 'ru' ? 'Выберите владельца ресторана' : 'Ресторан ээсин тандаңыз');
      return;
    }
    
    setActionLoading(true);
    try {
      const selectedOwner = owners.find(o => o.id === restaurantForm.ownerId);
      const ownerData = selectedOwner ? {
        ownerId: selectedOwner.id,
        ownerName: selectedOwner.name || selectedOwner.email,
        ownerEmail: selectedOwner.email
      } : {};

      if (restaurantForm.id) {
        await updateDoc(doc(db, 'restaurants', restaurantForm.id), {
          name: restaurantForm.name,
          email: restaurantForm.email,
          phone: restaurantForm.phone,
          category: restaurantForm.category,
          description: restaurantForm.description,
          address: restaurantForm.address,
          imageBase64: restaurantForm.imageBase64,
          ...ownerData,
          updatedAt: Timestamp.now()
        });
        setRestaurants(prev => prev.map(r => r.id === restaurantForm.id ? { 
          ...r, ...restaurantForm, ...ownerData, updatedAt: Timestamp.now() 
        } : r));
      } else {
        const docRef = await addDoc(collection(db, 'restaurants'), {
          name: restaurantForm.name,
          email: restaurantForm.email,
          phone: restaurantForm.phone,
          category: restaurantForm.category,
          description: restaurantForm.description,
          address: restaurantForm.address,
          imageBase64: restaurantForm.imageBase64,
          ...ownerData,
          createdAt: Timestamp.now(),
          status: 'active'
        });
        setRestaurants(prev => [...prev, { 
          id: docRef.id, ...restaurantForm, ...ownerData, 
          createdAt: Timestamp.now(), status: 'active' 
        }]);
      }
      setShowRestaurantModal(false);
      loadRestaurants();
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  // ===== OTHER ACTIONS =====
  const toggleBlockUser = async (userId, currentBlocked) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), { blocked: !currentBlocked });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: !currentBlocked } : u));
      loadOwners(); // Обновляем список владельцев
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const changeUserRole = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      loadOwners(); // Обновляем список владельцев
      setShowUserModal(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(txt.confirmDelete)) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      loadOwners(); // Обновляем список владельцев
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const deleteRestaurant = async (restId) => {
    if (!window.confirm(txt.confirmDelete)) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'restaurants', restId));
      const dishQuery = query(collection(db, 'dishes'), where('restaurantId', '==', restId));
      const dishSnap = await getDocs(dishQuery);
      await Promise.all(dishSnap.docs.map(d => deleteDoc(doc(db, 'dishes', d.id))));
      setRestaurants(prev => prev.filter(r => r.id !== restId));
      loadDishes();
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const deleteDish = async (dishId) => {
    if (!window.confirm(txt.confirmDelete)) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'dishes', dishId));
      setDishes(prev => prev.filter(d => d.id !== dishId));
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setShowOrderModal(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const handleApproveOwner = async (request) => {
    setActionLoading(true);
    try {
      await approveOwner(request.id, request);
      setOwnerRequests(prev => prev.filter(r => r.id !== request.id));
      loadUsers();
      loadOwners(); // Обновляем список владельцев
      loadRestaurants();
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const handleRejectOwner = async (requestId) => {
    setActionLoading(true);
    try {
      await rejectOwner(requestId);
      setOwnerRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const saveCategory = async () => {
    setActionLoading(true);
    try {
      if (categoryForm.id) {
        await updateDoc(doc(db, 'categories', categoryForm.id), {
          nameRu: categoryForm.nameRu,
          nameKy: categoryForm.nameKy,
          icon: categoryForm.icon
        });
      } else {
        await addDoc(collection(db, 'categories'), {
          nameRu: categoryForm.nameRu,
          nameKy: categoryForm.nameKy,
          icon: categoryForm.icon,
          createdAt: Timestamp.now()
        });
      }
      setShowCategoryModal(false);
      setCategoryForm({ id: '', nameRu: '', nameKy: '', icon: '' });
      loadCategories();
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const deleteCategory = async (catId) => {
    if (!window.confirm(txt.confirmDelete)) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', catId));
      setCategories(prev => prev.filter(c => c.id !== catId));
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
    setActionLoading(false);
  };

  const openEditCategory = (cat) => {
    setCategoryForm({ id: cat.id, nameRu: cat.nameRu, nameKy: cat.nameKy, icon: cat.icon || '' });
    setShowCategoryModal(true);
  };

  const openNewCategory = () => {
    setCategoryForm({ id: '', nameRu: '', nameKy: '', icon: '' });
    setShowCategoryModal(true);
  };

  const openUserModal = (u) => {
    setSelectedUser(u);
    setShowUserModal(true);
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const navigateToTab = (tabId) => {
    setActiveTab(tabId);
  };

  // ===== RENDER =====
  const renderDashboard = () => (
    <div className="admin-dashboard">
      <div className="stats-grid">
        <div className="stat-card stat-users" onClick={() => navigateToTab('users')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">👥</div>
          <div className="stat-info"><h3>{stats.totalUsers}</h3><p>{txt.totalUsers}</p></div>
        </div>
        <div className="stat-card stat-restaurants" onClick={() => navigateToTab('restaurants')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">🏪</div>
          <div className="stat-info"><h3>{stats.totalRestaurants}</h3><p>{txt.totalRestaurants}</p></div>
        </div>
        <div className="stat-card stat-dishes" onClick={() => navigateToTab('dishes')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">🍽️</div>
          <div className="stat-info"><h3>{stats.totalDishes}</h3><p>{txt.totalDishes}</p></div>
        </div>
        <div className="stat-card stat-orders" onClick={() => navigateToTab('orders')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📦</div>
          <div className="stat-info"><h3>{stats.totalOrders}</h3><p>{txt.totalOrders}</p></div>
        </div>
        <div className="stat-card stat-revenue" onClick={() => navigateToTab('orders')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-info"><h3>{stats.totalRevenue.toLocaleString()} {txt.som}</h3><p>{txt.totalRevenue}</p></div>
        </div>
        <div className="stat-card stat-pending" onClick={() => navigateToTab('requests')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">⏳</div>
          <div className="stat-info"><h3>{stats.pendingRequests}</h3><p>{txt.pendingRequests}</p></div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>📈 {language === 'ru' ? 'Последние заказы' : 'Акыркы буйрутмалар'}</h3>
          {orders.slice(0, 5).length === 0 ? (
            <p className="no-data">{txt.noData}</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th>ID</th><th>{txt.customerInfo}</th><th>{txt.total}</th><th>{txt.status}</th></tr></thead>
              <tbody>
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(-6)}</td>
                    <td>{order.customerName || order.customerEmail || '-'}</td>
                    <td>{order.total?.toLocaleString()} {txt.som}</td>
                    <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-section">
          <h3>📝 {language === 'ru' ? 'Новые заявки' : 'Жаңы арыздар'}</h3>
          {ownerRequests.slice(0, 5).length === 0 ? (
            <p className="no-data">{txt.noData}</p>
          ) : (
            <div className="request-list">
              {ownerRequests.slice(0, 5).map(req => (
                <div key={req.id} className="request-card">
                  <div><strong>{req.restaurantName}</strong><p>{req.email}</p></div>
                  <div className="request-actions">
                    <button className="btn-approve" onClick={() => handleApproveOwner(req)} disabled={actionLoading}>{txt.approve}</button>
                    <button className="btn-reject" onClick={() => handleRejectOwner(req.id)} disabled={actionLoading}>{txt.reject}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-section">
      <h2>👥 {txt.users}</h2>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr><th>{txt.name}</th><th>{txt.email}</th><th>{txt.phone}</th><th>{txt.role}</th><th>{txt.status}</th><th>{txt.createdAt}</th><th>{txt.actions}</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.blocked ? 'row-blocked' : ''}>
                <td>{u.name || u.displayName || '-'}</td>
                <td>{u.email}</td>
                <td>{u.phone || '-'}</td>
                <td><span className={`role-badge role-${u.role}`}>{u.role === 'admin' ? txt.admin : u.role === 'owner' ? txt.owner : txt.customer}</span></td>
                <td><span className={`status-badge ${u.blocked ? 'status-blocked' : 'status-active'}`}>{u.blocked ? txt.blocked : txt.active}</span></td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openUserModal(u)} title={txt.changeRole}>🔄</button>
                    <button className={`btn-icon ${u.blocked ? 'btn-unblock' : 'btn-block'}`} onClick={() => toggleBlockUser(u.id, u.blocked)} disabled={actionLoading} title={u.blocked ? txt.unblock : txt.block}>{u.blocked ? '🔓' : '🔒'}</button>
                    <button className="btn-icon btn-delete" onClick={() => deleteUser(u.id)} disabled={actionLoading} title={txt.delete}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRestaurants = () => (
    <div className="admin-section">
      <div className="section-header">
        <h2>🏪 {txt.restaurants}</h2>
        <button className="btn-primary" onClick={openNewRestaurant}>+ {txt.addRestaurant}</button>
      </div>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{language === 'ru' ? 'Фото' : 'Сүрөт'}</th>
              <th>{txt.restaurantName}</th>
              <th>{language === 'ru' ? 'Владелец' : 'Ээси'}</th>
              <th>{txt.email}</th>
              <th>{txt.phone}</th>
              <th>{txt.category}</th>
              <th>{txt.createdAt}</th>
              <th>{txt.actions}</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map(r => (
              <tr key={r.id}>
                <td>
                  {r.imageBase64 ? (
                    <img src={r.imageBase64} alt={r.name} className="restaurant-thumb" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🍽️</div>
                  )}
                </td>
                <td><strong>{r.name}</strong></td>
                <td>
                  {r.ownerName ? (
                    <span className="owner-badge" style={{ 
                      background: '#e3f2fd', 
                      color: '#1976d2', 
                      padding: '4px 10px', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      👤 {r.ownerName}
                    </span>
                  ) : (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>
                      {language === 'ru' ? 'Нет владельца' : 'Ээси жок'}
                    </span>
                  )}
                </td>
                <td>{r.email || '-'}</td>
                <td>{r.phone || '-'}</td>
                <td>{r.category || '-'}</td>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditRestaurant(r)} title={txt.edit}>✏️</button>
                    <button className="btn-icon btn-delete" onClick={() => deleteRestaurant(r.id)} disabled={actionLoading} title={txt.delete}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDishes = () => (
    <div className="admin-section">
      <h2>🍽️ {txt.dishes}</h2>
      <div className="table-container">
        <table className="admin-table">
          <thead><tr><th>{txt.name}</th><th>{txt.restaurantName}</th><th>{txt.price}</th><th>{txt.category}</th><th>{txt.actions}</th></tr></thead>
          <tbody>
            {dishes.map(d => (
              <tr key={d.id}>
                <td><div className="dish-cell">{d.imageBase64 && <img src={d.imageBase64} alt="" className="dish-thumb" />}<span>{d.name}</span></div></td>
                <td>{d.restaurantName || restaurants.find(r => r.id === d.restaurantId)?.name || '-'}</td>
                <td>{d.price?.toLocaleString()} {txt.som}</td>
                <td>{d.category || '-'}</td>
                <td><div className="action-buttons"><button className="btn-icon btn-delete" onClick={() => deleteDish(d.id)} disabled={actionLoading} title={txt.delete}>🗑️</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="admin-section">
      <h2>📦 {txt.orders}</h2>
      <div className="table-container">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>{txt.customerInfo}</th><th>{txt.total}</th><th>{txt.status}</th><th>{txt.orderDate}</th><th>{txt.actions}</th></tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id.slice(-6)}</td>
                <td>{order.customerName || order.customerEmail || '-'}</td>
                <td>{order.total?.toLocaleString()} {txt.som}</td>
                <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                <td><div className="action-buttons"><button className="btn-icon" onClick={() => openOrderModal(order)} title={txt.view}>👁️</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="admin-section">
      <h2>📝 {txt.requests}</h2>
      {ownerRequests.length === 0 ? (
        <p className="no-data">{txt.noData}</p>
      ) : (
        <div className="requests-grid">
          {ownerRequests.map(req => (
            <div key={req.id} className="request-card-full">
              <div className="request-header"><h4>{req.restaurantName}</h4><span className="status-badge status-pending">{txt.pending}</span></div>
              <div className="request-body">
                <p><strong>{txt.email}:</strong> {req.email}</p>
                <p><strong>{txt.phone}:</strong> {req.phone || '-'}</p>
                <p><strong>{txt.description}:</strong> {req.description || '-'}</p>
                <p><strong>{txt.createdAt}:</strong> {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}</p>
              </div>
              <div className="request-actions">
                <button className="btn-approve" onClick={() => handleApproveOwner(req)} disabled={actionLoading}>✅ {txt.approve}</button>
                <button className="btn-reject" onClick={() => handleRejectOwner(req.id)} disabled={actionLoading}>❌ {txt.reject}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCategories = () => (
    <div className="admin-section">
      <div className="section-header"><h2>📂 {txt.categories}</h2><button className="btn-primary" onClick={openNewCategory}>+ {txt.newCategory}</button></div>
      <div className="table-container">
        <table className="admin-table">
          <thead><tr><th>Icon</th><th>RU</th><th>KY</th><th>{txt.actions}</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td className="cat-icon">{cat.icon || '📁'}</td>
                <td>{cat.nameRu}</td>
                <td>{cat.nameKy}</td>
                <td><div className="action-buttons"><button className="btn-icon" onClick={() => openEditCategory(cat)} title={txt.edit}>✏️</button><button className="btn-icon btn-delete" onClick={() => deleteCategory(cat.id)} disabled={actionLoading} title={txt.delete}>🗑️</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===== MODALS =====
  const renderUserModal = () => {
    if (!showUserModal || !selectedUser) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>{txt.changeRole}: {selectedUser.name || selectedUser.email}</h3>
          <div className="role-selector">
            {['customer', 'owner', 'admin'].map(role => (
              <button key={role} className={`role-btn ${selectedUser.role === role ? 'active' : ''}`} onClick={() => changeUserRole(selectedUser.id, role)} disabled={actionLoading}>
                {role === 'admin' ? txt.admin : role === 'owner' ? txt.owner : txt.customer}
              </button>
            ))}
          </div>
          <button className="btn-secondary" onClick={() => setShowUserModal(false)}>{txt.cancel}</button>
        </div>
      </div>
    );
  };

  const renderCategoryModal = () => {
    if (!showCategoryModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>{categoryForm.id ? txt.edit : txt.newCategory}</h3>
          <div className="form-group"><label>Icon (emoji)</label><input type="text" value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} placeholder="🍕" /></div>
          <div className="form-group"><label>Название (RU)</label><input type="text" value={categoryForm.nameRu} onChange={e => setCategoryForm({ ...categoryForm, nameRu: e.target.value })} /></div>
          <div className="form-group"><label>Аталышы (KY)</label><input type="text" value={categoryForm.nameKy} onChange={e => setCategoryForm({ ...categoryForm, nameKy: e.target.value })} /></div>
          <div className="modal-actions"><button className="btn-primary" onClick={saveCategory} disabled={actionLoading}>{txt.save}</button><button className="btn-secondary" onClick={() => setShowCategoryModal(false)}>{txt.cancel}</button></div>
        </div>
      </div>
    );
  };

  const renderRestaurantModal = () => {
    if (!showRestaurantModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowRestaurantModal(false)}>
        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
          <h3>{restaurantForm.id ? txt.editRestaurant : txt.newRestaurant}</h3>
          
          <div className="form-group">
            <label>{restaurantForm.imageBase64 ? txt.changeImage : txt.selectImage}</label>
            <div className="image-upload-area" style={{ marginBottom: '15px' }}>
              {restaurantForm.imageBase64 ? (
                <img src={restaurantForm.imageBase64} alt="Preview" style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '10px', display: 'block', marginBottom: '10px' }} />
              ) : (
                <div style={{ width: '200px', height: '150px', background: '#f0f0f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', fontSize: '48px' }}>
                  🍽️
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleRestaurantImage} style={{ display: 'block' }} />
              <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
                {language === 'ru' ? 'Макс. 2MB (JPEG, PNG)' : 'Макс. 2MB (JPEG, PNG)'}
              </small>
            </div>
          </div>

          <div className="form-group"><label>{txt.restaurantName} *</label><input type="text" value={restaurantForm.name} onChange={e => setRestaurantForm({ ...restaurantForm, name: e.target.value })} placeholder="NAVAT" /></div>
          
          <div className="form-group">
            <label>{language === 'ru' ? 'Владелец ресторана *' : 'Ресторан ээси *'}</label>
            <select 
              value={restaurantForm.ownerId} 
              onChange={e => {
                const owner = owners.find(o => o.id === e.target.value);
                setRestaurantForm({ 
                  ...restaurantForm, 
                  ownerId: e.target.value,
                  ownerName: owner?.name || owner?.email || '',
                  ownerEmail: owner?.email || ''
                });
              }}
              required
            >
              <option value="">— {language === 'ru' ? 'Выберите владельца' : 'Ээси тандаңыз'} —</option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.id}>
                  {owner.name || owner.email} ({owner.email})
                </option>
              ))}
            </select>
            {owners.length === 0 && (
              <small style={{ color: '#ff6b35', display: 'block', marginTop: '5px' }}>
                ⚠️ {language === 'ru' ? txt.noOwners : txt.noOwners}
              </small>
            )}
          </div>

          <div className="form-group"><label>{txt.email}</label><input type="email" value={restaurantForm.email} onChange={e => setRestaurantForm({ ...restaurantForm, email: e.target.value })} /></div>
          <div className="form-group"><label>{txt.phone}</label><input type="tel" value={restaurantForm.phone} onChange={e => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} /></div>
          <div className="form-group"><label>{txt.category}</label>
            <select value={restaurantForm.category} onChange={e => setRestaurantForm({ ...restaurantForm, category: e.target.value })}>
              <option value="">—</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.nameRu}>{cat.nameRu}</option>
              ))}
            </select>
          </div>
          <div className="form-group"><label>{txt.description}</label><textarea value={restaurantForm.description} onChange={e => setRestaurantForm({ ...restaurantForm, description: e.target.value })} rows="3" /></div>
          <div className="form-group"><label>{txt.address}</label><input type="text" value={restaurantForm.address} onChange={e => setRestaurantForm({ ...restaurantForm, address: e.target.value })} /></div>
          
          <div className="modal-actions">
            <button className="btn-primary" onClick={saveRestaurant} disabled={actionLoading || !restaurantForm.ownerId}>{txt.save}</button>
            <button className="btn-secondary" onClick={() => setShowRestaurantModal(false)}>{txt.cancel}</button>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderModal = () => {
    if (!showOrderModal || !selectedOrder) return null;
    const statuses = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'];
    return (
      <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
          <h3>📦 Заказ #{selectedOrder.id.slice(-6)}</h3>
          <div className="order-details">
            <div className="order-info-grid">
              <div>
                <p><strong>{txt.customerInfo}:</strong></p>
                <p>{selectedOrder.customerName || '-'}</p>
                <p>{selectedOrder.customerEmail || '-'}</p>
                <p>{selectedOrder.customerPhone || '-'}</p>
                <p>{selectedOrder.address || '-'}</p>
              </div>
              <div>
                <p><strong>{txt.orderDate}:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</p>
                <p><strong>{txt.total}:</strong> {selectedOrder.total?.toLocaleString()} {txt.som}</p>
                <p><strong>{txt.status}:</strong> <span className={`status-badge status-${selectedOrder.status}`}>{selectedOrder.status}</span></p>
              </div>
            </div>
            <h4>{txt.orderItems}</h4>
            <table className="admin-table">
              <thead><tr><th>{txt.name}</th><th>{txt.quantity}</th><th>{txt.price}</th><th>{txt.total}</th></tr></thead>
              <tbody>
                {(selectedOrder.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price?.toLocaleString()} {txt.som}</td>
                    <td>{(item.price * item.quantity)?.toLocaleString()} {txt.som}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="status-changer">
              <p><strong>{language === 'ru' ? 'Изменить статус:' : 'Статусту өзгөртүү:'}</strong></p>
              <div className="status-buttons">
                {statuses.map(s => (
                  <button key={s} className={`status-btn ${selectedOrder.status === s ? 'active' : ''}`} onClick={() => updateOrderStatus(selectedOrder.id, s)} disabled={actionLoading}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => setShowOrderModal(false)}>{txt.cancel}</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>{txt.loading}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: txt.dashboard, icon: '📊' },
    { id: 'users', label: txt.users, icon: '👥' },
    { id: 'restaurants', label: txt.restaurants, icon: '🏪' },
    { id: 'dishes', label: txt.dishes, icon: '🍽️' },
    { id: 'orders', label: txt.orders, icon: '📦' },
    { id: 'requests', label: txt.requests, icon: '📝' },
    { id: 'categories', label: txt.categories, icon: '📂' },
  ];

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-logo"><h2>🍛 OshMenu</h2><span className="admin-badge">ADMIN</span></div>
        <nav className="admin-nav">
          {tabs.map(tab => (
            <button key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {tab.id === 'requests' && stats.pendingRequests > 0 && <span className="nav-badge">{stats.pendingRequests}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer"><p>{user?.email}</p></div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="header-actions">
            <button className="lang-toggle" onClick={() => { const newLang = language === 'ru' ? 'ky' : 'ru'; setLanguage(newLang); try { localStorage.setItem('oshmenu-lang', newLang); } catch(e) {} }}>
              {language === 'ru' ? '🇰🇬 КЫ' : '🇷🇺 РУ'}
            </button>
            <button className="btn-refresh" onClick={loadAllData} title="Обновить">🔄</button>
          </div>
        </header>
        <div className="admin-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'restaurants' && renderRestaurants()}
          {activeTab === 'dishes' && renderDishes()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'categories' && renderCategories()}
        </div>
      </main>

      {renderUserModal()}
      {renderCategoryModal()}
      {renderRestaurantModal()}
      {renderOrderModal()}
    </div>
  );
};

export default AdminPanel;