import "server-only";

import { authRouter } from "@/server/routers/auth";
import { feedbacksRouter } from "@/server/routers/feedbacks";
import { productsRouter } from "@/server/routers/products";
import { createCallerFactory, router } from "@/server/trpc";

export const appRouter = router({
  auth: authRouter,
  products: productsRouter,
  feedbacks: feedbacksRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
