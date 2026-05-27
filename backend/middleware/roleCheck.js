// Проверка роли admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ только для администратора' });
  }
  next();
};

// Проверка роли owner
const isOwner = (req, res, next) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ только для владельца' });
  }
  next();
};

// Проверка: admin или owner
const isAdminOrOwner = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }
  next();
};

module.exports = { isAdmin, isOwner, isAdminOrOwner };