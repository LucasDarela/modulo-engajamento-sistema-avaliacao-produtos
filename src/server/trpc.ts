import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@/server/db";
import { deleteSession, getSession } from "@/server/session";

export async function createContext() {
  return { session: await getSession() };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        fieldErrors:
          error.cause instanceof z.ZodError
            ? z.flattenError(error.cause).fieldErrors
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Exige sessão válida; dentro da procedure `ctx.session` nunca é null
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const unauthorized = new TRPCError({
    code: "UNAUTHORIZED",
    message: "Você precisa entrar para continuar.",
  });
  if (!ctx.session) throw unauthorized;

  // O JWT vale 7 dias: confere no banco se a conta ainda existe e está ativa,
  // para uma conta desativada ou apagada não continuar escrevendo
  const { data: account, error } = await db
    .from("accounts")
    .select("active")
    .eq("id", ctx.session.accountId)
    .maybeSingle();
  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível validar sua sessão. Tente novamente.",
      cause: error,
    });
  }
  if (!account?.active) {
    await deleteSession();
    throw unauthorized;
  }

  return next({ ctx: { session: ctx.session } });
});
