require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = require("./src/App");
const { pool } = require("./src/config/database");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3001;

// ⚠️ Necesario para que Vercel permita cookies SameSite=None
app.set("trust proxy", 1);

// ===== CORS CORRECTO =====
app.use(
  cors({
    origin: [
      "https://pagina-class-access.vercel.app",  // tu FRONT REAL
      "http://localhost:3000"
    ],
    credentials: true,
  })
);

// cookie parser
app.use(cookieParser());

// Solo corre en local (Vercel no necesita listen)
if (process.env.NODE_ENV !== "production") {
  pool.connect((err, client, release) => {
    if (err) {
      logger.error("Error en conexión a la BD:", err);
      process.exit(1);
    }
    logger.info("✅ Conectado a PostgreSQL");
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
