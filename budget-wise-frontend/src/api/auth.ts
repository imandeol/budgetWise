import { api } from "./client";
import type { User } from "../types";

export async function signUp(name: string, email: string, password: string) {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data as { user: User; token: string };
}

export async function signIn(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });
  return res.data as { user: User; token: string };
}
