import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { AppError } from "../../utils/AppError";
import { RegisterInput, LoginInput } from "./auth.validation";

const SALT_ROUNDS = 10;
const SELLER_ACCESS_MS = 30 * 24 * 60 * 60 * 1000;

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  // Buyers need a profile row before their first cart mutation.  Creating an
  // intentionally incomplete profile here lets checkout work before optional
  // preference onboarding, while onboardingCompleted remains the source of truth.
  const user = await prisma.user.create({
    data: input.role === "buyer"
      ? { email: input.email, passwordHash, role: input.role, buyerProfile: { create: {} } }
      : { email: input.email, passwordHash, role: input.role, sellerEnabled: true, sellerAccessExpiresAt: sellerExpiry() },
  });

  const tokens = issueTokens(user.id, user.role, user.sellerAccessExpiresAt);
  return { user: sanitize(user), ...tokens };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_DEACTIVATED", "This account has been deactivated");
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const activeUser = await normalizeExpiredSellerMode(user);
  const tokens = issueTokens(activeUser.id, activeUser.role, activeUser.sellerAccessExpiresAt);
  return { user: sanitize(activeUser), ...tokens };
}

export async function refreshTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "User no longer exists");
  }
  if (!user.isActive) {
    throw new AppError(401, "ACCOUNT_DEACTIVATED", "This account has been deactivated");
  }
  const activeUser = await normalizeExpiredSellerMode(user);
  return { user: sanitize(activeUser), ...issueTokens(activeUser.id, activeUser.role, activeUser.sellerAccessExpiresAt) };
}

export async function activateSeller(userId: string, password?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new AppError(401, "UNAUTHORIZED", "Account is not available");
  const expired = !user.sellerAccessExpiresAt || user.sellerAccessExpiresAt <= new Date();
  if (user.sellerEnabled && expired) {
    if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, "SELLER_REAUTH_REQUIRED", "Confirm your account password to resume seller access");
    }
  }
  const activeUser = await prisma.user.update({
    where: { id: userId },
    data: { role: "supplier", sellerEnabled: true, sellerAccessExpiresAt: sellerExpiry() },
  });
  return { user: sanitize(activeUser), ...issueTokens(activeUser.id, activeUser.role, activeUser.sellerAccessExpiresAt) };
}

export async function activateBuyer(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: "buyer", buyerProfile: { connectOrCreate: { where: { userId }, create: {} } } },
  });
  return { user: sanitize(user), ...issueTokens(user.id, user.role, user.sellerAccessExpiresAt) };
}

async function normalizeExpiredSellerMode(user: { id: string; email: string; passwordHash: string; role: "buyer" | "supplier" | "admin"; createdAt: Date; isActive: boolean; sellerEnabled: boolean; sellerAccessExpiresAt: Date | null }) {
  if (user.role !== "supplier" || (user.sellerAccessExpiresAt && user.sellerAccessExpiresAt > new Date())) return user;
  return prisma.user.update({
    where: { id: user.id },
    data: { role: "buyer", buyerProfile: { connectOrCreate: { where: { userId: user.id }, create: {} } } },
  });
}

function sellerExpiry() { return new Date(Date.now() + SELLER_ACCESS_MS); }

function issueTokens(userId: string, role: "buyer" | "supplier" | "admin", sellerAccessExpiresAt?: Date | null) {
  const payload = { sub: userId, role, ...(role === "supplier" && sellerAccessExpiresAt ? { sellerAccessExpiresAt: sellerAccessExpiresAt.getTime() } : {}) };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function sanitize(user: { id: string; email: string; role: string; createdAt: Date; sellerEnabled: boolean }) {
  return { id: user.id, email: user.email, role: user.role, sellerEnabled: user.sellerEnabled, createdAt: user.createdAt };
}
