// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getRestaurantsList, getRestaurantById } = require('./data');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));

// Хранилище
let orders = [];
let orderIdCounter = 1;
const userStats = {}; // phone -> { orderCount, totalSpent }

// ========== API ==========

app.get('/api/restaurants', (req, res) => {
    res.json(getRestaurantsList());
});

app.get('/api/restaurants/:id', (req, res) => {
  try {
    const restaurant = getRestaurantById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Ресторан не найден' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить скидку пользователя
app.get('/api/discount/:phone', (req, res) => {
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
});

// Создать заказ
app.post('/api/orders', (req, res) => {
    const { restaurantId, items, total, type, phone, address, table, comment, discountUsed } = req.body;
    
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
        address,
        table,
        comment,
        status: 'new',
        createdAt: new Date().toISOString()
    };
    
    orders.push(order);
    console.log('Новый заказ:', order);
    
    res.status(201).json({ 
        success: true, 
        orderId: order.id, 
        order,
        userStats: userStats[phone]
    });
});

// Получить заказы пользователя (история)
app.get('/api/orders/user/:phone', (req, res) => {
    const userOrders = orders.filter(o => o.phone === req.params.phone)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
});

// Получить заказы ресторана
app.get('/api/orders/restaurant/:id', (req, res) => {
    const restaurantOrders = orders.filter(o => o.restaurantId === parseInt(req.params.id));
    res.json(restaurantOrders);
});

app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const order = orders.find(o => o.id === parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    
    order.status = status;
    res.json({ success: true, order });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📊 Добавлено ресторанов: ${getRestaurantsList().length}`);
});