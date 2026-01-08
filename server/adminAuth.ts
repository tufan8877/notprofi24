import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import createMemoryStore from "memorystore";

export type AdminUser = {
  email: string;
  role: "admin";
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends AdminUser {}
  }
}

function getAdminCreds() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  return { email, password };
}

export function setupAdminAuth(app: Express) {
  // Render/Proxies: required so secure cookies work behind reverse proxy.
  app.set("trust proxy", 1);

  const { email: adminEmail, password: adminPassword } = getAdminCreds();
  if (process.env.NODE_ENV === "production") {
    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET is required in production");
    }
    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in production");
    }
  }

  const MemoryStore = createMemoryStore(session);
  const sessionSecret = process.env.SESSION_SECRET || "dev-secret";

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      (email, password, done) => {
        const { email: adminEmail, password: adminPassword } = getAdminCreds();
        if (!adminEmail || !adminPassword) {
          return done(null, false, { message: "Admin credentials not configured" });
        }
        if (email === adminEmail && password === adminPassword) {
          return done(null, { email, role: "admin" });
        }
        return done(null, false, { message: "Invalid credentials" });
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as AdminUser).email);
  });

  passport.deserializeUser((email, done) => {
    done(null, { email: String(email), role: "admin" });
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // --- Auth API ---
  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: unknown, user: Express.User | false, info?: { message?: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Unauthorized" });
      req.logIn(user, (err2) => {
        if (err2) return next(err2);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.isAuthenticated?.() && req.user) {
      return res.json(req.user);
    }
    return res.status(401).json({ message: "Unauthorized" });
  });

  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session?.destroy(() => {
        res.status(204).send();
      });
    });
  });

  // Compatibility endpoints used by the existing UI helpers
  app.get("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session?.destroy(() => {
        res.redirect("/login");
      });
    });
  });
  app.get("/api/login", (_req: Request, res: Response) => {
    res.redirect("/login");
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated?.() && req.user?.role === "admin") {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
