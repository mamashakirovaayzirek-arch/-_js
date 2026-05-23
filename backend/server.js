const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Хранилище данных в JSON
const DATA_FILE = './data.json';

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return {
    users: [],
    restaurants: [
      { _id: '1', name: 'Ресторан 1', description: 'Описание 1', image: '🍔' },
      { _id: '2', name: 'Ресторан 2', description: 'Описание 2', image: '🍕' },
      { _id: '3', name: 'Ресторан 3', description: 'Описание 3', image: '🍜' }
    ],
    dishes: [],
    orders: []
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();
const JWT_SECRET = process.env.JWT_SECRET || 'oshmenu_secret';

// Middleware для проверки токена
function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Нет токена' });
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Неверный токен' });
  }
}

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (data.users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Пользователь уже существует' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    _id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    role: role || 'customer',
    totalSpent: 0
  };
  
  data.users.push(user);
  saveData(data);
  
  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { ...user, password: undefined } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = data.users.find(u => u.email === email);
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ message: 'Неверный email или пароль' });
  }
  
  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { ...user, password: undefined } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = data.users.find(u => u._id === req.user.userId);
  res.json({ ...user, password: undefined });
});

// ===== RESTAURANTS =====
app.get('/api/restaurants', (req, res) => {
  res.json(data.restaurants);
});

// ===== DISHES =====
app.get('/api/dishes/restaurant/:restaurantId', (req, res) => {
  const dishes = data.dishes.filter(d => d.restaurant === req.params.restaurantId);
  res.json(dishes);
});

app.post('/api/dishes', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }
  
  const { name, price, ingredients, image, restaurant } = req.body;
  const dish = {
    _id: Date.now().toString(),
    name,
    price: Number(price),
    ingredients,
    image,
    restaurant
  };
  
  data.dishes.push(dish);
  saveData(data);
  res.status(201).json(dish);
});

app.delete('/api/dishes/:id', auth, (req, res) => {
  const dish = data.dishes.find(d => d._id === req.params.id);
  if (!dish) return res.status(404).json({ message: 'Не найдено' });
  
  if (req.user.role === 'owner' && dish.restaurant !== req.user.restaurant) {
    return res.status(403).json({ message: 'Нельзя удалить чужое блюдо' });
  }
  
  data.dishes = data.dishes.filter(d => d._id !== req.params.id);
  saveData(data);
  res.json({ message: 'Удалено' });
});

// ===== ORDERS =====
app.post('/api/orders', auth, (req, res) => {
  const { dishes, orderType, address, phone } = req.body;
  const user = data.users.find(u => u._id === req.user.userId);
  
  let totalAmount = dishes.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountApplied = 0;
  
  // СКИДКА: если накоплено >= 2000 сом
  if (user.totalSpent >= 2000) {
    discountApplied = 200;
  }
  
  const finalAmount = Math.max(0, totalAmount - discountApplied);
  
  const order = {
    _id: Date.now().toString(),
    user: user._id,
    dishes,
    totalAmount,
    discountApplied,
    finalAmount,
    status: 'pending',
    orderType,
    address,
    phone,
    createdAt: new Date().toISOString()
  };
  
  data.orders.push(order);
  
  // Обновляем totalSpent при завершении (сейчас сразу для теста)
  user.totalSpent += finalAmount;
  saveData(data);
  
  res.status(201).json({
    order,
    discountApplied,
    message: discountApplied > 0 ? `🎉 Скидка ${discountApplied} сом применена!` : null
  });
});

app.get('/api/orders/my', auth, (req, res) => {
  const orders = data.orders.filter(o => o.user === req.user.userId).reverse();
  res.json(orders);
});

// Создаём папку uploads
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`💾 Данные хранятся в ${DATA_FILE}`);
});