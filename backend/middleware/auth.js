const jwt = require('jsonwebtoken');

// Проверка JWT токена
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Нет токена, доступ запрещён' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, ... }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Неверный токен' });
  }
};

module.exports = auth;