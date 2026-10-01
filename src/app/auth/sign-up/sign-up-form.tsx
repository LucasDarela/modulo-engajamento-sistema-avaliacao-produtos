"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FieldPath, useForm } from "react-hook-form";

import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type SignUpInput, signUpSchema } from "@/lib/validation/sign-up";
import { useTRPC } from "@/trpc/client";

type FieldConfig = {
  name: FieldPath<SignUpInput>;
  label: string;
  type: string;
  autoComplete: string;
  hint?: string;
};

const nameFields: FieldConfig[] = [
  {
    name: "firstName",
    label: "Nome",
    type: "text",
    autoComplete: "given-name",
  },
  {
    name: "lastName",
    label: "Sobrenome",
    type: "text",
    autoComplete: "family-name",
  },
];

const accountFields: FieldConfig[] = [
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Senha",
    type: "password",
    autoComplete: "new-password",
    hint: "Use pelo menos 8 caracteres.",
  },
  {
    name: "confirmPassword",
    label: "Confirmar senha",
    type: "password",
    autoComplete: "new-password",
  },
];

export function SignUpForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signUp = useMutation(
    trpc.auth.signUp.mutationOptions({
      onSuccess: () => router.push("/auth/sign-up/success"),
    }),
  );

  const renderField = ({
    name,
    label,
    type,
    autoComplete,
    hint,
  }: FieldConfig) => {
    const error = form.formState.errors[name];
    const hintId = hint ? `${name}-hint` : undefined;
    const inputProps = {
      id: name,
      autoComplete,
      "aria-invalid": !!error,
      "aria-describedby": hintId,
      className:
        "h-11 rounded-lg bg-card px-3.5 text-base text-foreground md:text-base",
      ...form.register(name),
    };
    return (
      <Field key={name} data-invalid={!!error}>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        {type === "password" ? (
          <PasswordInput {...inputProps} />
        ) : (
          <Input type={type} {...inputProps} />
        )}
        {error ? (
          <FieldError errors={[error]} />
        ) : (
          hint && <FieldDescription id={hintId}>{hint}</FieldDescription>
        )}
      </Field>
    );
  };

  return (
    <form
      noValidate
      className="mt-7"
      onSubmit={form.handleSubmit((values) => signUp.mutate(values))}
    >
      <FieldGroup className="gap-4">
        {signUp.error && (
          <Alert
            variant="destructive"
            className="rounded-lg border-destructive/30 bg-destructive/5 px-3.5 py-3"
          >
            <CircleAlert />
            <AlertTitle>Não foi possível criar sua conta</AlertTitle>
            <AlertDescription>{signUp.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {nameFields.map(renderField)}
        </div>
        {accountFields.map(renderField)}

        <Button
          type="submit"
          disabled={signUp.isPending}
          className="mt-2 h-11 w-full rounded-lg text-base font-semibold shadow-sm shadow-primary/25 hover:bg-primary/90"
        >
          {signUp.isPending && <Loader2 className="animate-spin" />}
          {signUp.isPending ? "Criando conta..." : "Criar conta"}
        </Button>
        <p className="-mt-1 text-center text-sm leading-relaxed text-muted-foreground">
          Ao criar sua conta, você concorda com os{" "}
          <span className="font-medium text-foreground">Termos de uso</span> e a{" "}
          <span className="font-medium text-foreground">
            Política de privacidade
          </span>
          .
        </p>
      </FieldGroup>
    </form>
  );
}
