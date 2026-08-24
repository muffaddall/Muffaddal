"use server";

import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/auth";

function passwordsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function login(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const password = String(formData.get("password") ?? "");
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return { error: "Server is missing SITE_PASSWORD configuration." };
  }

  if (!password || !passwordsMatch(password, sitePassword)) {
    return { error: "Wrong password." };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
