// config/security.js

const corsOptions = {
  origin: [
    "https://pagina-class-access.vercel.app",   // FRONTEND REAL EN VERCEL
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true, // NECESARIO PARA COOKIES
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200
};

module.exports = { corsOptions };
