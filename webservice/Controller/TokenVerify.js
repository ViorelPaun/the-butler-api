const jwt = require('jsonwebtoken')
const key = '123456'


const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(200).json({ success: false, msg: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(200).json({ success: false, msg: 'Token not found.' });
  }

  jwt.verify(token, key, (err, decoded) => {

    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(200).json({ success: false, msg: 'Token expired.', tokenExpire: 1 });
      }
      return res.status(200).json({ success: false, msg: 'Failed to authenticate token.' });

    }
    req.userId = decoded.subject;
    next();
  });
};

module.exports = { verifyToken }