// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getRestaurantsList, getRestaurantById } = require('./data');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS для реального домена
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Статические файлы (картинки)
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));

// Хранилище (временное — заменим на MongoDB позже)
let orders = [];
let orderIdCounter = 1;
const userStats = {}; // phone -> { orderCount, totalSpent }

// ========== API ==========

// Получить все рестораны
app.get('/api/restaurants', (req, res) => {
  try {
    res.json(getRestaurantsList());
  } catch (error) {
    console.error('Ошибка при получении ресторанов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить один ресторан
app.get('/api/restaurants/:id', (req, res) => {
  try {
    const restaurant = getRestaurantById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Ресторан не найден' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Ошибка при получении ресторана:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить скидку пользователя
app.get('/api/discount/:phone', (req, res) => {
  try {
    const phone = req.params.phone;
    const stats = userStats[phone] || { orderCount: 0, totalSpent: 0 };
    
    // Скидка 800 сом каждый 15-й заказ
    const isDiscountAvailable = stats.orderCount > 0 && stats.orderCount % 15 === 0;
    const nextDiscountIn = 15 - (stats.orderCount % 15);
    
    res.json({
      orderCount: stats.orderCount,
      totalSpent: stats.totalSpent,
      discountAvailable: isDiscountAvailable,
      discountAmount: isDiscountAvailable ? 800 : 0,
      nextDiscountIn: nextDiscountIn === 15 ? 0 : nextDiscountIn
    });
  } catch (error) {
    console.error('Ошибка при получении скидки:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создать заказ
app.post('/api/orders', (req, res) => {
  try {
    const { restaurantId, items, total, type, phone, address, table, comment, discountUsed } = req.body;
    
    // Валидация
    if (!phone || !items || !total || !type) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }
    
    // Обновляем статистику пользователя
    if (!userStats[phone]) {
      userStats[phone] = { orderCount: 0, totalSpent: 0 };
    }
    userStats[phone].orderCount++;
    userStats[phone].totalSpent += total;
    
    const order = {
      id: orderIdCounter++,
      restaurantId,
      restaurantName: getRestaurantById(restaurantId)?.name || 'Неизвестно',
      items,
      total,
      originalTotal: discountUsed ? total + 800 : total,
      discountUsed: discountUsed || false,
      discountAmount: discountUsed ? 800 : 0,
      type,
      phone,
      address: address || null,
      table: table || null,
      comment: comment || null,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    
    orders.push(order);
    console.log('✅ Новый заказ:', order.id, 'Ресторан:', order.restaurantName);
    
    res.status(201).json({ 
      success: true, 
      orderId: order.id, 
      order,
      userStats: userStats[phone]
    });
  } catch (error) {
    console.error('Ошибка при создании заказа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить заказы пользователя (история)
app.get('/api/orders/user/:phone', (req, res) => {
  try {
    const userOrders = orders.filter(o => o.phone === req.params.phone)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить заказы ресторана
app.get('/api/orders/restaurant/:id', (req, res) => {
  try {
    const restaurantOrders = orders.filter(o => o.restaurantId === parseInt(req.params.id));
    res.json(restaurantOrders);
  } catch (error) {
    console.error('Ошибка при получении заказов ресторана:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновить статус заказа
app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const order = orders.find(o => o.id === parseInt(req.params.id));
    
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    order.status = status;
    console.log('📝 Статус заказа', order.id, 'изменён на:', status);
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Ошибка при обновлении статуса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Health check (для мониторинга сервера)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок сервера
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Ресторанов в базе: ${getRestaurantsList().length}`);
  console.log(`🌍 CORS разрешён для: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});