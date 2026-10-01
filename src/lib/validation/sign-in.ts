import { z } from "zod";

// Sem regra de tamanho na senha: o login não revela a política de senha
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe seu email")
    .pipe(z.email("Informe um email válido")),
  password: z.string().min(1, "Informe sua senha"),
});

export type SignInInput = z.input<typeof signInSchema>;
