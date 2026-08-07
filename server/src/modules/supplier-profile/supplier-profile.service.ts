import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { UpsertSupplierProfileInput } from "./supplier-profile.validation";

export async function getOwnProfile(userId: string) {
  const profile = await prisma.supplierProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Supplier profile not found");
  }
  return profile;
}

export async function upsertProfile(userId: string, input: UpsertSupplierProfileInput) {
  return prisma.supplierProfile.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}
