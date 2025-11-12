const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const express = require('express');
const swaggerUiAssetPath = require('swagger-ui-dist').absolutePath();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Servidor_ClassAccess API',
      version: '1.0.0',
      description: 'Documentación oficial de la API del sistema ClassAccess.',
    },
    servers: [
      { url: 'https://classaccess-backend.vercel.app/api' }, // 🌐 Producción
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
    security: [{ bearerAuth: [] }]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  // Servir archivos de Swagger UI desde swagger-ui-dist
  app.use('/api/docs', express.static(swaggerUiAssetPath));

  // Servir JSON con la definición de la API
  app.get('/api/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Página de documentación
  app.get('/api/docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>ClassAccess API Docs</title>
          <link rel="stylesheet" href="./swagger-ui.css" />
          <style>
            body { margin: 0; background: #fafafa; }
            .topbar { display: none; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="./swagger-ui-bundle.js"></script>
          <script src="./swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = () => {
              const ui = SwaggerUIBundle({
                url: '/api/docs/swagger.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                layout: "BaseLayout",
                persistAuthorization: true // 🔐 Mantiene el token JWT entre peticiones
              });
              window.ui = ui;
            };
          </script>
        </body>
      </html>
    `);
  });

  console.log('📘 Swagger disponible en /api/docs');
};

module.exports = setupSwagger;
