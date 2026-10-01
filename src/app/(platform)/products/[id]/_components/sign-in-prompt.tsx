import { MessageSquareText } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function SignInPrompt() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:p-7">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <MessageSquareText className="size-6" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <h3 className="text-lg font-semibold tracking-[-0.015em]">
          Entre para avaliar este produto
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Sua nota e seu comentário ajudam outras pessoas a decidir.
        </p>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <Link
          href="/auth/sign-in"
          className={buttonVariants({
            className: "h-10 flex-1 rounded-lg px-4 font-semibold sm:flex-none",
          })}
        >
          Entrar
        </Link>
        <Link
          href="/auth/sign-up"
          className={buttonVariants({
            variant: "outline",
            // O cn do projeto não faz merge: sem o "!" o border-transparent da base vence
            className:
              "h-10 flex-1 rounded-lg border-input px-4 font-semibold sm:flex-none",
          })}
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
