const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Dish = require('../models/Dish');
const auth = require('../middleware/auth');
const { isAdminOrOwner } = require('../middleware/roleCheck');

// Настройка Multer для загрузки фото
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // макс 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения!'), false);
    }
  }
});

// Получить блюда ресторана
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurant: req.params.restaurantId });
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить одно блюдо
router.get('/:id', async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id).populate('restaurant');
    if (!dish) {
      return res.status(404).json({ message: 'Блюдо не найдено' });
    }
    res.json(dish);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ДОБАВИТЬ БЛЮДО (admin или owner)
router.post('/', auth, isAdminOrOwner, upload.single('image'), async (req, res) => {
  try {
    const { name, price, ingredients, restaurant } = req.body;
    
    // Owner может добавлять только в свой ресторан
    if (req.user.role === 'owner' && req.user.restaurant?.toString() !== restaurant) {
      return res.status(403).json({ message: 'Можно добавлять только в свой ресторан' });
    }

    const dish = new Dish({
      name,
      price: Number(price),
      ingredients,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      restaurant
    });

    await dish.save();
    res.status(201).json(dish);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Удалить блюдо
router.delete('/:id', auth, isAdminOrOwner, async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ message: 'Блюдо не найдено' });
    }
    
    // Owner проверка
    if (req.user.role === 'owner' && dish.restaurant.toString() !== req.user.restaurant?.toString()) {
      return res.status(403).json({ message: 'Нельзя удалить чужое блюдо' });
    }

    await Dish.findByIdAndDelete(req.params.id);
    res.json({ message: 'Блюдо удалено' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;