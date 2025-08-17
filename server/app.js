// server/app.js
import createError from "http-errors";
import express, { Router, json, urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";
import dotenv from "dotenv";
dotenv.config();

// DB pool (pour /health)
import db from "./database/connection.js";

// Routers
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import cartsRouter from "./routes/carts.js";
import ordersRouter from "./routes/orders.js";
import reviewsRouter from "./routes/reviews.js";
import promotionsRouter from "./routes/promotions.js";
import productsSizeRouter from "./routes/productsSize.js";
import productsImageRouter from "./routes/productsImage.js";

const app = express();
const apiRouter = Router();

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// Middlewares
app.use(logger("dev"));
app.use(json({ limit: "1mb" }));
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

// Health check (ping DB)
apiRouter.get("/health", async (_req, res) => {
  try {
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true, db: "up" });
  } catch (e) {
    console.error("Healthcheck error:", e);
    res.status(500).json({ ok: false, db: "down" });
  }
});

// API routes
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/cart", cartsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/reviews", reviewsRouter);

apiRouter.use("/promotions", promotionsRouter);
import adminOrdersRouter from "./routes/admin.orders.js";
app.use(
  "/api/admin",
  (req, _res, next) => {
    console.log("[admin] hit:", req.method, req.originalUrl);
    next();
  },
  adminOrdersRouter
);

// Routes tailles & images produits (exposées sous /api)
apiRouter.use("/", productsSizeRouter);   // GET /products/:productId/sizes, POST /products/:productId/sizes, PUT/DELETE /sizes/:id
apiRouter.use("/", productsImageRouter);  // GET /products/:productId/images, POST /products/:productId/images, DELETE /images/:id

app.disable("etag");
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.removeHeader("Last-Modified");
  next();
});


app.use("/api", apiRouter);
app.use("/api", productsImageRouter);

// 404 → error handler
app.use((req, res, next) => {
  next(createError(404, "Resource not found"));
});

// Error handler JSON
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const isDev = req.app.get("env") === "development";
  res.status(status).json({
    message: err.message || "Server error",
    ...(isDev && { stack: err.stack }),
  });
});

export default app;
