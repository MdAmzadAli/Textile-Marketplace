import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { RoleType } from "../config/constants";

export interface JwtPayload {
  sub: string;
  role: RoleType;
  sellerAccessExpiresAt?: number;
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
