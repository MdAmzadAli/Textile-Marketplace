import { api } from "./api";

export async function deactivateOwnAccount() {
  await api.delete("/users/me");
}

export async function updateOwnEmail(email: string) {
  const res = await api.patch<{ data: { email: string } }>("/users/me/email", { email });
  return res.data.data;
}

export async function updateOwnPassword(currentPassword: string, newPassword: string) {
  await api.patch("/users/me/password", { currentPassword, newPassword });
}
