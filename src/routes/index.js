const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const studentsRoutes = require('./students.routes');
const teachersRoutes = require('./teachers.routes');
const attendanceRoutes = require('./attendance.routes');
const devicesRoutes = require('./devices.routes');
const classroomsRoutes = require('./classrooms.routes');
const notificationsRoutes = require('./notifications.routes');
const reportsRoutes = require('./reports.routes');
const guardiaRoutes = require('./guardia.routes');
const esp32Routes = require('./esp32.routes');
const horariosRoutes = require('./horarios.routes');
const reportsAsistenciaRoutes = require('./reportsAsistencia.routes');

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/students', studentsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/devices', devicesRoutes);
router.use('/classrooms', classroomsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/reports/asistencia', reportsAsistenciaRoutes); // Antes de /reports (más específica)
router.use('/reports', reportsRoutes);
router.use('/horarios', horariosRoutes);
router.use('/guardia', guardiaRoutes);
router.use('/esp32', esp32Routes);   // Publico - sin autenticacion

module.exports = router;