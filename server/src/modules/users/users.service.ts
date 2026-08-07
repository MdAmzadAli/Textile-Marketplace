import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/AppError";
import { UpdateEmailInput, UpdatePasswordInput } from "./users.validation";

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { buyerProfile: true, supplierProfile: true },
  });
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function deactivateCurrentUser(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
}

export async function updateEmail(userId: string, input: UpdateEmailInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing && existing.id !== userId) throw new AppError(409, "EMAIL_TAKEN", "That email address is already in use");
  const user = await prisma.user.update({ where: { id: userId }, data: { email: input.email } });
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function updatePassword(userId: string, input: UpdatePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new AppError(400, "INVALID_PASSWORD", "Your current password is incorrect");
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(input.newPassword, 10) } });
}
