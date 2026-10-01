"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type SignInInput, signInSchema } from "@/lib/validation/sign-in";
import { useTRPC } from "@/trpc/client";

const inputClassName =
  "h-11 rounded-lg bg-card px-3.5 text-base text-foreground md:text-base";

export function SignInForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const signIn = useMutation(
    trpc.auth.signIn.mutationOptions({
      onSuccess: () => {
        router.replace("/");
        router.refresh();
      },
      onError: () => form.setFocus("password", { shouldSelect: true }),
    }),
  );

  // Continua ocupado até a navegação para a home terminar
  const busy = signIn.isPending || signIn.isSuccess;
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="mt-7"
      onSubmit={form.handleSubmit((values) => signIn.mutate(values))}
    >
      <FieldGroup className="gap-4">
        {signIn.error && (
          <Alert
            variant="destructive"
            className="rounded-lg border-destructive/30 bg-destructive/5 px-3.5 py-3"
          >
            <CircleAlert />
            <AlertTitle>Não foi possível entrar</AlertTitle>
            <AlertDescription>{signIn.error.message}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!errors.email}
            className={inputClassName}
            {...form.register("email")}
          />
          {errors.email && <FieldError errors={[errors.email]} />}
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className={inputClassName}
            {...form.register("password")}
          />
          {errors.password && <FieldError errors={[errors.password]} />}
        </Field>

        <Button
          type="submit"
          disabled={busy}
          className="mt-2 h-11 w-full rounded-lg text-base font-semibold shadow-sm shadow-primary/25 hover:bg-primary/90"
        >
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link
            href="/auth/sign-up"
            className="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Criar conta
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
