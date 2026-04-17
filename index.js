// // index.js
// import express from "express";
// import cookieParser from "cookie-parser";
// import dotenv from "dotenv";
// import mustacheExpress from "mustache-express";
// import path from "path";
// import { fileURLToPath } from "url";

// // import authRoutes from "./routes/auth.js"; // (optional - if you already had this)
// import courseRoutes from "./routes/courses.js"; // JSON API
// import sessionRoutes from "./routes/sessions.js"; // JSON API
// import bookingRoutes from "./routes/bookings.js"; // JSON API
// import viewRoutes from "./routes/views.js"; // <-- NEW: SSR pages
// import { attachDemoUser } from "./middlewares/demoUser.js";

// import { initDb } from "./models/_db.js";
// await initDb();

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // View engine (Mustache)
// app.engine(
//   "mustache",
//   mustacheExpress(path.join(__dirname, "views", "partials"), ".mustache")
// );
// app.set("view engine", "mustache");
// app.set("views", path.join(__dirname, "views"));

// // Body parsing for forms (no body-parser package)
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
// app.use(cookieParser());

// // Static assets
// app.use("/static", express.static(path.join(__dirname, "public")));

// // Attach a demo user to req/res.locals so pages can show a logged-in user
// app.use(attachDemoUser);

// // Health
// app.get("/health", (req, res) => res.json({ ok: true }));

// // JSON API routes
// // app.use('/auth', authRoutes);
// app.use("/courses", courseRoutes);
// app.use("/sessions", sessionRoutes);
// app.use("/bookings", bookingRoutes);
// app.use("/views", viewRoutes);

// // 404 & 500
// export const not_found = (req, res) =>
//   res.status(404).type("text/plain").send("404 Not found.");
// export const server_error = (err, req, res, next) => {
//   console.error(err);
//   res.status(500).type("text/plain").send("Internal Server Error.");
// };
// app.use(not_found);
// app.use(server_error);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Yoga booking running`, `port ${PORT}`));

// index.js
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mustacheExpress from "mustache-express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";

// import authRoutes from './routes/auth.js';
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import sessionRoutes from "./routes/sessions.js";
import bookingRoutes from "./routes/bookings.js";
import organiserRoutes from "./routes/organiser.js";
import viewRoutes from "./routes/views.js";
import { loadUser } from "./middlewares/auth.js";
import { initDb } from "./models/_db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// View engine (Mustache)
app.engine(
  "mustache",
  mustacheExpress(path.join(__dirname, "views", "partials"), ".mustache")
);
app.set("view engine", "mustache");
app.set("views", path.join(__dirname, "views"));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Session middleware - must be before routes
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Static
app.use("/static", express.static(path.join(__dirname, "public")));

// Load user from session into req.user (runs on every request)
app.use(loadUser);

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Auth routes (login, logout)
app.use("/auth", authRoutes);

// Organiser routes (course/session CRUD)
app.use("/organiser", organiserRoutes);

// SSR view routes (must come before API routes to take precedence)
app.use("/", viewRoutes);

// JSON API routes (secondary, for API clients)
app.use("/courses", courseRoutes);
app.use("/sessions", sessionRoutes);
app.use("/bookings", bookingRoutes);

// Errors
export const not_found = (req, res) =>
  res.status(404).type("text/plain").send("404 Not found.");
export const server_error = (err, req, res, next) => {
  console.error(err);
  res.status(500).type("text/plain").send("Internal Server Error.");
};
app.use(not_found);
app.use(server_error);

// Only start the server outside tests
if (process.env.NODE_ENV !== "test") {
  await initDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Yoga booking running on http://localhost:${PORT}`)
  );
}
