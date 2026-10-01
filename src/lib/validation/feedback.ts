import { z } from "zod";

export const FEEDBACK_COMMENT_MAX_LENGTH = 2000;
export const FEEDBACK_SCORE_MIN = 1;
export const FEEDBACK_SCORE_MAX = 5;

const SCORE_MESSAGE = "Escolha uma nota de 1 a 5";

// Campos que a pessoa preenche no formulário (o produto vem da URL)
export const feedbackFieldsSchema = z.object({
  score: z
    .int(SCORE_MESSAGE)
    .min(FEEDBACK_SCORE_MIN, SCORE_MESSAGE)
    .max(FEEDBACK_SCORE_MAX, SCORE_MESSAGE),
  comment: z
    .string("Conte um pouco sobre sua experiência")
    .trim()
    .min(1, "Conte um pouco sobre sua experiência")
    .max(
      FEEDBACK_COMMENT_MAX_LENGTH,
      `O comentário deve ter no máximo ${FEEDBACK_COMMENT_MAX_LENGTH} caracteres`,
    ),
});

export const createFeedbackSchema = feedbackFieldsSchema.extend({
  productId: z.string().trim().min(1, "Informe o produto"),
});

export type FeedbackFieldsInput = z.input<typeof feedbackFieldsSchema>;
export type CreateFeedbackInput = z.input<typeof createFeedbackSchema>;
