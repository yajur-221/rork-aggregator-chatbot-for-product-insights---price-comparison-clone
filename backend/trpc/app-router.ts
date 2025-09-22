import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { scrapeProcedure } from "./routes/scraper/scrape/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  scraper: createTRPCRouter({
    scrape: scrapeProcedure,
  }),
});

export type AppRouter = typeof appRouter;