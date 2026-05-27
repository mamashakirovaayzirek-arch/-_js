const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Получить все рестораны
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate('owner', 'name');
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить один ресторан
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Ресторан не найден' });
    }
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать ресторан (только admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, image, owner } = req.body;
    const restaurant = new Restaurant({ name, description, image, owner });
    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;