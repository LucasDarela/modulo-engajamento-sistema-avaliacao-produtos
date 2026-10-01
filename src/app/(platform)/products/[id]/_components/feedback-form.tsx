"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { ScoreInput } from "@/components/score-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  type FeedbackFieldsInput,
  feedbackFieldsSchema,
} from "@/lib/validation/feedback";
import { useTRPC } from "@/trpc/client";

type FeedbackFormProps = {
  productId: string;
  authorName: string;
};

export function FeedbackForm({ productId, authorName }: FeedbackFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isRefreshing, startTransition] = useTransition();

  const form = useForm<FeedbackFieldsInput>({
    resolver: zodResolver(feedbackFieldsSchema),
    defaultValues: { score: 0, comment: "" },
    // O comment é registrado antes do Controller da nota; o foco segue a ordem visual abaixo
    shouldFocusError: false,
  });

  const create = useMutation(
    trpc.feedbacks.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        // A home guarda a lista no cache do React Query; sem isso a nota e a
        // contagem do card ficam velhas ao voltar por navegação client-side
        queryClient.invalidateQueries(trpc.products.list.pathFilter());
        // Busca produto, média e lista de novo no servidor, sem recarregar a página
        startTransition(() => router.refresh());
      },
    }),
  );

  const comment = form.watch("comment") ?? "";
  const commentLength = comment.trim().length;
  const isBusy = create.isPending || isRefreshing;
  const { errors } = form.formState;

  return (
    <form
      noValidate
      aria-labelledby="avaliar-titulo"
      className="rounded-2xl border bg-card p-5 sm:p-7"
      onSubmit={form.handleSubmit(
        (values) => create.mutate({ ...values, productId }),
        (invalid) => form.setFocus(invalid.score ? "score" : "comment"),
      )}
      // Ao editar de novo, some a confirmação da avaliação anterior
      onChange={() => {
        if (create.isSuccess) create.reset();
      }}
    >
      <h3
        id="avaliar-titulo"
        className="text-lg font-semibold tracking-[-0.015em]"
      >
        Avalie este produto
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Sua avaliação será publicada como{" "}
        <span className="font-medium text-foreground">{authorName}</span>.
      </p>

      <FieldGroup className="mt-6 gap-5">
        {create.error && (
          <Alert
            variant="destructive"
            className="rounded-lg border-destructive/30 bg-destructive/5 px-3.5 py-3"
          >
            <CircleAlert />
            <AlertTitle>Não foi possível publicar sua avaliação</AlertTitle>
            <AlertDescription>{create.error.message}</AlertDescription>
          </Alert>
        )}

        {create.isSuccess && !isRefreshing && (
          <output className="flex items-center gap-2.5 rounded-lg bg-accent px-3.5 py-3 text-sm font-medium text-accent-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">
            <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
            Avaliação publicada. Obrigado por contar sua experiência.
          </output>
        )}

        <Field data-invalid={!!errors.score}>
          <Controller
            control={form.control}
            name="score"
            render={({ field }) => (
              <ScoreInput
                ref={field.ref}
                name={field.name}
                legend="Sua nota"
                value={field.value ?? 0}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.score}
                disabled={isBusy}
                aria-describedby={errors.score ? "score-error" : undefined}
              />
            )}
          />
          {errors.score && (
            <FieldError id="score-error" errors={[errors.score]} />
          )}
        </Field>

        <Field data-invalid={!!errors.comment}>
          <FieldLabel htmlFor="comment">Comentário</FieldLabel>
          <Textarea
            id="comment"
            rows={5}
            maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
            placeholder="O que você achou? Conte o que funcionou bem e o que poderia ser melhor."
            aria-invalid={!!errors.comment}
            aria-describedby={
              errors.comment ? "comment-error comment-count" : "comment-count"
            }
            disabled={isBusy}
            className="min-h-32 resize-y rounded-lg bg-card px-3.5 py-3 text-base leading-relaxed md:text-base"
            {...form.register("comment")}
          />
          <div className="flex items-start justify-between gap-4">
            {errors.comment ? (
              <FieldError id="comment-error" errors={[errors.comment]} />
            ) : (
              <span />
            )}
            <span
              id="comment-count"
              className="shrink-0 text-xs text-muted-foreground tabular-nums"
            >
              {commentLength.toLocaleString("pt-BR")}/
              {FEEDBACK_COMMENT_MAX_LENGTH.toLocaleString("pt-BR")}
            </span>
          </div>
        </Field>

        <Button
          type="submit"
          disabled={isBusy}
          className="h-11 w-full rounded-lg px-6 text-base font-semibold shadow-sm shadow-primary/25 hover:bg-primary/90 sm:w-fit"
        >
          {isBusy && <Loader2 className="animate-spin" />}
          {isBusy ? "Publicando..." : "Publicar avaliação"}
        </Button>
      </FieldGroup>
    </form>
  );
}
