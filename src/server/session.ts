import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

// Contrato da sessão (Fase 0): consumido pelo tRPC, pelo header e pelo feedback
export type Session = {
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
};

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Variável de ambiente SESSION_SECRET não configurada");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(account: Session): Promise<void> {
  const token = await new SignJWT({
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(account.accountId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

// Uma verificação por render; token ausente, adulterado ou expirado vira null
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  // Fora do try: segredo ausente é erro de configuração, não "sessão inválida"
  const key = getKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    const { sub, firstName, lastName, email } = payload;
    if (
      typeof sub !== "string" ||
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string"
    ) {
      return null;
    }
    return { accountId: sub, firstName, lastName, email };
  } catch {
    return null;
  }
});
