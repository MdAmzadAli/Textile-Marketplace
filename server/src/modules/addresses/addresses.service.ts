import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { AddressInput } from "./addresses.validation";

export function listAddresses(buyerId: string) {
  return prisma.address.findMany({ where: { buyerId }, orderBy: { updatedAt: "desc" } });
}
export function createAddress(buyerId: string, input: AddressInput) {
  return prisma.address.create({ data: { buyerId, ...input } });
}
export async function updateAddress(buyerId: string, id: string, input: AddressInput) {
  const address = await prisma.address.findFirst({ where: { id, buyerId } });
  if (!address) throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
  return prisma.address.update({ where: { id }, data: input });
}
export async function deleteAddress(buyerId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, buyerId } });
  if (!address) throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
  await prisma.address.delete({ where: { id } });
}
