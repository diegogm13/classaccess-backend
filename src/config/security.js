// config/security.js

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://pagina-class-access.vercel.app",   // 🔥 FRONTEND REAL EN VERCEL
      "https://classaccess-backend.vercel.app",   // 🔥 Tu backend (requests internos)
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174"
    ];

    // 🔥 Permitir requests sin origin (Postman, mobile apps, cURL, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // ✅ NECESARIO PARA COOKIES
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With", 
    "Accept",
    "Origin" // 🔥 Agregar Origin
  ],
  exposedHeaders: [
    "Content-Range", 
    "X-Content-Range",
    "set-cookie" // 🔥 Exponer set-cookie para que el navegador lo reciba
  ],
  maxAge: 86400, // 🔥 Cache preflight por 24 horas
  optionsSuccessStatus: 200
};

module.exports = { corsOptions };