import { Response } from "express";
import { generateSlug } from "../helpers/generateSlug";
import { RequestWithTimerStore } from "../common/types/express/types";

// export const slugHandler = (req: RequestWithTimerStore, res: Response) => {
export const slugHandler = (req: RequestWithTimerStore, res: Response) => {
  if (!req.timerStore) {
      return res.status(500).json({
        message: "Timer Store was not found in request.",
      });
  }

  let slug = generateSlug();
  const existingStores = Object.keys(req.timerStore);
  let retryAttempts = 0;

  /* 
	Attempt to re-generate a room name that isn't taken . Cutoff after 50
	attempts in worst case scenario.
	*/
  while (existingStores.includes(slug)) {
    if (retryAttempts >= 50) {
      return res.status(429).json({
        message: "Issue generating slug, no available slugs found.",
      });
    }

    slug = generateSlug();
    retryAttempts++;
  }

  res.json({
    slug,
  });
};

