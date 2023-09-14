import { Infer, object } from "superstruct";
import { SmoochRecipes } from "./smooch-recipes";

export const SmoochConfig = object({
    ...SmoochRecipes.getRecipeConfigs(),
});

export type SmoochConfigType = Infer<typeof SmoochConfig>;