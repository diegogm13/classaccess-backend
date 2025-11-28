const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Servidor_ClassAccess API',
      version: '1.0.0',
      description: 'Documentación de la API con Swagger',
    },
    servers: [
      { url: 'http://localhost:3001/api' }, // este es el que usarás en local
      { url: 'https://classaccess-backend.vercel.app/api' }
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
  
  app.get('/api/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(specs);
  });

  app.get('/api/docs', (req, res) => {
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');

    // 🔥 CSP COMPLETAMENTE CORRECTO PARA SWAGGER
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; " +
      "style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data: https://cdnjs.cloudflare.com; " +
      "connect-src 'self' http://localhost:3001 https://classaccess-backend.vercel.app;"
    );

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClassAccess API Documentation</title>

  <link rel="stylesheet" 
    href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css" 
    crossorigin="anonymous" 
    referrerpolicy="no-referrer"
  />
  
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script 
    src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-bundle.min.js" 
    crossorigin="anonymous" 
    referrerpolicy="no-referrer">
  </script>

  <script 
    src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-standalone-preset.min.js" 
    crossorigin="anonymous" 
    referrerpolicy="no-referrer">
  </script>

  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>
    `);
  });
};

module.exports = setupSwagger;
