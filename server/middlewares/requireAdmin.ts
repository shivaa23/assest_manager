import { Request, Response, NextFunction } from "express";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401); // Not logged in
  }

  if (!req.user || !req.user.isAdmin) {
    return res.sendStatus(403); // Not admin
  }

  next();
}
