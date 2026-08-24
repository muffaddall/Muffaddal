import "server-only";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pcp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 180; // 180 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ scope: "site" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
