import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { z } from "zod";

import type { SignInInput } from "@/lib/validation/sign-in";
import { readJsonBody } from "@/server/http";
import { createCaller } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

// Contrato REST da spec; a procedure grava o cookie de sessão na resposta
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (parsed.error) return parsed.error;
  const { body } = parsed;

  try {
    // O body é validado pelo zod dentro da procedure
    const account = await createCaller(await createContext()).auth.signIn(
      body as SignInInput,
    );
    return Response.json(account, { status: 200 });
  } catch (error) {
    if (!(error instanceof TRPCError)) throw error;

    const isValidation = error.cause instanceof z.ZodError;
    return Response.json(
      {
        error: {
          code: error.code,
          message: isValidation ? "Dados inválidos." : error.message,
          ...(isValidation && {
            fieldErrors: z.flattenError(error.cause).fieldErrors,
          }),
        },
      },
      { status: getHTTPStatusCodeFromError(error) },
    );
  }
}
