const UserModel = require('../models/User.model');
const AuthService = require('./auth.service');

class UsersService {
  static async getAllUsers() {
    const users = await UserModel.findAll();

    const sanitizedUsers = users.map(u => {
      delete u.password;
      return u;
    });

    return {
      alumnos: sanitizedUsers.filter(u => u.priv_usu === 1),
      maestros: sanitizedUsers.filter(u => u.priv_usu === 2),
      administradores: sanitizedUsers.filter(u => u.priv_usu === 3)
    };
  }

  static async createUser(userData) {
    const {
      nombre,
      ap,
      am,
      correo,
      password,
      priv,
      matricula,
      cod_rfid,
      grupo,
      no_empleado
    } = userData;

    const hashedPassword = await AuthService.hashPassword(password);

    const { client, idUsuario } = await UserModel.createUser({
      nombre,
      ap,
      am,
      correo,
      hashedPassword,
      priv
    });

    // Registrar alumno
    if (priv === 1) {
      await UserModel.insertAlumno(client, idUsuario, { matricula, cod_rfid, grupo });
    }
    // Registrar maestro
    else if (priv === 2) {
      await UserModel.insertProfesor(client, idUsuario, { no_empleado });
    }
    // Admin no necesita tabla extra

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
