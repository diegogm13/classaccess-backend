const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Token principal (access token)
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id_usu,
        correo: user.correo_usu,
        priv_usu: user.priv_usu
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  // 🔹 NUEVO: Refresh Token (token de larga duración)
  static generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id_usu
      },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret_default',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // 🔹 NUEVO: Verificar refresh token
  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret_default');
  }
}

module.exports = AuthService;
