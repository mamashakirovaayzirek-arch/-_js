const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, restaurantId } = req.body;
    
    // Проверка существующего пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer',
      restaurant: role === 'owner' ? restaurantId : null
    });

    await user.save();

    // Генерация токена
    const token = jwt.sign(
      { userId: user._id, role: user.role, restaurant: user.restaurant },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalSpent: user.totalSpent
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// ВХОД
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, restaurant: user.restaurant },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalSpent: user.totalSpent
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;