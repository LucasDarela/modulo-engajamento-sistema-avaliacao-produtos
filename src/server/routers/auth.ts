import "server-only";

import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

import { signInSchema } from "@/lib/validation/sign-in";
import { signUpSchema } from "@/lib/validation/sign-up";
import { db } from "@/server/db";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "@/server/password";
import { createSession, deleteSession } from "@/server/session";
import { publicProcedure, router } from "@/server/trpc";

// Código do Postgres para violação de constraint unique
const UNIQUE_VIOLATION = "23505";

// Mensagem única para email inexistente, senha errada e conta inativa
const INVALID_CREDENTIALS = "Email ou senha inválidos.";

export const authRouter = router({
  signUp: publicProcedure.input(signUpSchema).mutation(async ({ input }) => {
    const { hash, salt } = await hashPassword(input.password);

    // Unicidade do email garantida pelo índice no banco, sem corrida entre checar e inserir
    const { data, error } = await db
      .from("accounts")
      .insert({
        id: nanoid(),
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        password: hash,
        salt,
      })
      .select("id, first_name, last_name, email, created_at")
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email já tem uma conta. Use outro email.",
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível criar a conta. Tente novamente.",
        cause: error,
      });
    }

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      createdAt: data.created_at,
    };
  }),

  signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
    // O schema já normaliza o email para minúsculas, igual ao sign-up
    const { data: account, error } = await db
      .from("accounts")
      .select("id, first_name, last_name, email, password, active")
      .eq("email", input.email)
      .maybeSingle();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível entrar agora. Tente novamente.",
        cause: error,
      });
    }

    // Compara mesmo sem conta, para o tempo de resposta não revelar quais emails existem
    const passwordMatches = await verifyPassword(
      input.password,
      account?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!account || !passwordMatches || !account.active) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: INVALID_CREDENTIALS,
      });
    }

    await createSession({
      accountId: account.id,
      firstName: account.first_name,
      lastName: account.last_name,
      email: account.email,
    });

    return {
      id: account.id,
      firstName: account.first_name,
      lastName: account.last_name,
      email: account.email,
    };
  }),

  signOut: publicProcedure.mutation(async () => {
    await deleteSession();
    return { success: true };
  }),

  me: publicProcedure.query(({ ctx }) => ctx.session),
});
