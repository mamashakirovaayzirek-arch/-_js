const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');

const LOYALTY_THRESHOLD = 2000;   // порог для скидки
const LOYALTY_DISCOUNT = 200;     // сумма скидки

// Создать заказ (применяется скидка автоматически)
router.post('/', auth, async (req, res) => {
  try {
    const { dishes, orderType, address, phone } = req.body;
    const userId = req.user.userId;

    // Получаем пользователя для проверки totalSpent
    const user = await User.findById(userId);
    
    // Считаем сумму заказа
    let totalAmount = dishes.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Проверяем накопительную скидку
    let discountApplied = 0;
    if (user.totalSpent >= LOYALTY_THRESHOLD) {
      discountApplied = LOYALTY_DISCOUNT;
    }
    
    const finalAmount = Math.max(0, totalAmount - discountApplied);

    // Создаём заказ
    const order = new Order({
      user: userId,
      dishes: dishes.map(d => ({
        dish: d.dishId,
        quantity: d.quantity,
        price: d.price
      })),
      totalAmount,
      discountApplied,
      finalAmount,
      orderType,
      address,
      phone,
      status: 'pending'
    });

    await order.save();

    // Обновляем totalSpent пользователя (только когда заказ completed — см. ниже)
    // Пока что не обновляем, обновим при завершении заказа

    res.status(201).json({
      order,
      discountApplied,
      message: discountApplied > 0 
        ? `🎉 Применена накопительная скидка ${discountApplied} сом!` 
        : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получить заказы пользователя
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('dishes.dish')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Завершить заказ (admin/owner) — обновляет totalSpent
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    order.status = 'completed';
    await order.save();

    // Обновляем totalSpent пользователя
    await User.findByIdAndUpdate(
      order.user,
      { $inc: { totalSpent: order.finalAmount } }
    );

    res.json({ message: 'Заказ завершён', order });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все заказы (admin)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('dishes.dish')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;