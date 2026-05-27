const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'admin'], 
    default: 'customer' 
  },
  totalSpent: { type: Number, default: 0 }, // накопительная сумма для скидки
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    default: null // для owner — привязка к ресторану
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);