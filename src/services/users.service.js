const UserModel = require('../models/User.model');
const AuthService = require('./auth.service');

class UsersService {
  static async getAllUsers() {
    const users = await UserModel.findAll();

    // Eliminar contraseñas
    const sanitizedUsers = users.map(u => {
      delete u.password;
      return u;
    });

    // Agrupar por tipo de usuario
    return {
      alumnos: sanitizedUsers.filter(u => u.priv_usu === 1),
      maestros: sanitizedUsers.filter(u => u.priv_usu === 2),
      administradores: sanitizedUsers.filter(u => u.priv_usu === 3)
    };
  }

  static async createUser(userData) {
    const { nombre, ap, am, correo, password, matricula, cod_rfid, grupo } = userData;
    const priv = 1; // todos los que se registran son alumnos

    const hashedPassword = await AuthService.hashPassword(password);

    const { client, idUsuario } = await UserModel.createUser({ nombre, ap, am, correo, hashedPassword, priv });

    if (priv === 1) {
      await UserModel.insertAlumno(client, idUsuario, { matricula, cod_rfid, grupo });
    }

    await client.query('COMMIT');
    client.release();

    return { id_usu: idUsuario, correo, priv };
  }

  static async updateUserStatus(id, estatus) {
    await UserModel.updateStatus(id, estatus);
    return { userId: id, estatus };
  }
}

module.exports = UsersService;
