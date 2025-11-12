const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Servidor_ClassAccess API',
      version: '1.0.0',
      description: 'Documentación oficial de la API del sistema ClassAccess.',
    },
    servers: [
      { url: 'https://classaccess-backend.vercel.app/api' }, // 🌐 Producción (Vercel)
      { url: 'http://localhost:3000/api' }                   // 💻 Desarrollo local
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('📘 Swagger disponible en /api/docs');
};

module.exports = setupSwagger;
