import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { z } from "zod";

import type { SignUpInput } from "@/lib/validation/sign-up";
import { readJsonBody } from "@/server/http";
import { createCaller } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

// Contrato REST da spec, delegando para a mesma procedure tRPC usada pelo front
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (parsed.error) return parsed.error;
  const { body } = parsed;

  try {
    // O body é validado pelo zod dentro da procedure
    const account = await createCaller(await createContext()).auth.signUp(
      body as SignUpInput,
    );
    return Response.json(account, { status: 201 });
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
