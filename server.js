require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = require("./src/App");
const { pool } = require("./src/config/database");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3001;

// ⚠️ Obligatorio para cookies SameSite: none
app.set("trust proxy", 1);

// CORS CONFIG CORRECTO PARA VERCEL + COOKIES
app.use(cors({
  origin: [
    "https://classaccess-frontend.vercel.app", // tu dominio real
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(cookieParser());

// Solo local
if (process.env.NODE_ENV !== "production") {
  pool.connect((err, client, release) => {
    if (err) {
      logger.error("Error en la conexión a la base de datos:", err);
      process.exit(1);
    }
    logger.info("✅ Conectado a la base de datos PostgreSQL");
    release();
  });

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
    logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  });

  process.on("unhandledRejection", (err) => {
    logger.error("UNHANDLED REJECTION! 💥 Cerrando servidor...", err);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    logger.info("👋 SIGTERM recibido. Cerrando servidor gracefully...");
    server.close(() => {
      logger.info("💥 Proceso terminado");
    });
  });
}

module.exports = app;
