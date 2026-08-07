import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import supplierProfileRoutes from "./modules/supplier-profile/supplier-profile.routes";
import productsRoutes from "./modules/products/products.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";
import buyerProfileRoutes from "./modules/buyer-profile/buyer-profile.routes";
import cartRoutes from "./modules/cart/cart.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import addressesRoutes from "./modules/addresses/addresses.routes";

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/supplier-profile", supplierProfileRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/buyer-profile", buyerProfileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/addresses", addressesRoutes);

app.use(errorHandler);

export default app;
