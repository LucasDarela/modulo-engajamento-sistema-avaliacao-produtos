import { z } from "zod";

// bcrypt só considera os primeiros 72 bytes da senha
const BCRYPT_MAX_BYTES = 72;
const PASSWORD_MIN_LENGTH = 8;

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Informe seu ${label}`)
    .max(100, `O ${label} deve ter no máximo 100 caracteres`);

export const signUpSchema = z
  .object({
    firstName: name("nome"),
    lastName: name("sobrenome"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Informe seu email")
      .pipe(z.email("Informe um email válido")),
    password: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
      )
      .refine(
        (value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES,
        "A senha é longa demais",
      ),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.input<typeof signUpSchema>;
