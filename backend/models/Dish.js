const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  ingredients: { type: String, required: true },
  image: { type: String, required: true }, // путь к фото
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema);