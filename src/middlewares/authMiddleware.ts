import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_SECRET) {
  throw new Error(
    "Missing ACCESS_TOKEN_SECRET in environment. Set ACCESS_TOKEN_SECRET in your .env file.",
  );
}

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}
const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Token primit în server:", token);

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Missing authentication token.",
    });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    req.user = decoded;

    if (decoded && decoded.exp) {
      const timestampCurent = Math.floor(Date.now() / 1000); // Timpul actual în secunde
      const timpRamasSecunde = decoded.exp - timestampCurent;
      const minuteRamase = Math.floor(timpRamasSecunde / 60);
      const dataExpirare = new Date(decoded.exp * 1000).toLocaleString("ro-RO");

      console.log("============== DETALII VALABILITATE TOKEN ==============");
      console.log(`📅 Data și ora expirării: ${dataExpirare}`);

      if (timpRamasSecunde > 0) {
        console.log(
          `⏳ Mai este valabil încă: ${minuteRamase} minute și ${timpRamasSecunde % 60} secunde.`,
        );
      } else {
        console.log("❌ Token-ul a expirat deja!");
      }
      console.log("========================================================");
    }

    next();
  } catch (error) {
    res.status(403).json({
      error: "Invalid or expired token. Please re-authenticate.",
    });
  }
};
const checkRole = (...allowRoles: ("admin" | "customer")[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({
        error: "Unauthenticated user.",
      });
    }
    if (!allowRoles.includes(req.user.role as any)) {
      return res.status(403).json({
        error: "Forbidden. Insufficient permissions.",
      });
    }

    next();
  };
};
const authMiddleware = {
  verifyToken,
  checkRole,
};
export default authMiddleware;
