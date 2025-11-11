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

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/students', studentsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/devices', devicesRoutes);
router.use('/classrooms', classroomsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;