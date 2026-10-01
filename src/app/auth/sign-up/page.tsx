import type { Metadata } from "next";
import Link from "next/link";

import { AuthHero } from "@/components/auth-hero";
import { BrandLogo } from "@/components/brand-logo";

import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 lg:grid lg:min-h-screen lg:grid-cols-2">
      <AuthHero title="Avalie o que você compra. Descubra o que vale a pena." />

      <section className="flex flex-1 flex-col px-4 py-10 sm:px-8 lg:justify-center lg:py-12">
        <div className="mx-auto w-full max-w-[400px]">
          <BrandLogo className="mb-12 lg:hidden" />
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.025em]">
            Crie sua conta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Comece a avaliar produtos em menos de um minuto.
          </p>
          <SignUpForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              href="/auth/sign-in"
              className="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
