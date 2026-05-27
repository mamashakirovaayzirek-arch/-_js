const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dishes: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    quantity: { type: Number, default: 1 },
    price: { type: Number } // цена на момент заказа
  }],
  totalAmount: { type: Number, required: true },
  discountApplied: { type: Number, default: 0 }, // сумма скидки
  finalAmount: { type: Number, required: true }, // итог с учётом скидки
  status: { 
    type: String, 
    enum: ['pending', 'cooking', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderType: { 
    type: String, 
    enum: ['delivery', 'pickup', 'dine-in'],
    default: 'delivery'
  },
  address: { type: String },
  phone: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);