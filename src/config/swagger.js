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
      { url: 'https://classaccess-backend.vercel.app/api' },
      { url: 'http://localhost:3000/api' }
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
  // Endpoint para servir el JSON de Swagger
  app.get('/api/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(specs);
  });

  // Endpoint para servir la UI de Swagger desde CDN
  app.get('/api/docs', (req, res) => {
    // Establecer headers CSP directamente en la respuesta
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data: https://cdnjs.cloudflare.com;"
    );
    
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClassAccess API Documentation</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css" integrity="sha512-W8J9htScz2qJ5MccL4fT8HqR8vGFJO8dJoHJVR0yJstr2feTdAmCYkzDylpsH1RjvWNVZrHvgJmkPLe0tLsDZg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <style>
    body { 
      margin: 0; 
      padding: 0; 
    }
    .swagger-ui .topbar { 
      display: none; 
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-bundle.min.js" integrity="sha512-jdKH4QjQ5pHUfPd/D4F0FVL7dZJIlARQRq7vxCpfKLMPqCEC2defTfLeIzCLbVwKNV76plxfBhKSGoF5F6LBBw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-standalone-preset.min.js" integrity="sha512-VTdH7sa1Y7XDxmd+7OL5nOqdOZyvYp/goZGy7hu8VUWZ3D1eFDCcrUOlp2GpYQTc1P2ioLB5mLNGlfiuXOGJJQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
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