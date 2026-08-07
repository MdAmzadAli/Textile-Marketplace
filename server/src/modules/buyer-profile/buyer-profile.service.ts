import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { UpsertBuyerProfileInput } from "./buyer-profile.validation";

export async function getOwnProfile(userId: string) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Buyer profile not found");
  }
  return profile;
}

export async function upsertProfile(userId: string, input: UpsertBuyerProfileInput) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.buyerProfile.upsert({
      where: { userId },
      update: { ...input, onboardingCompleted: true },
      create: { userId, ...input, onboardingCompleted: true },
    });

    // Ensure every buyer has exactly one cart, created lazily on first profile save.
    await tx.cart.upsert({
      where: { buyerId: userId },
      update: {},
      create: { buyerId: userId },
    });

    return profile;
  });
}
