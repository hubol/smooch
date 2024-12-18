import { enums, Infer, object } from "superstruct";
import { SmoochRecipes } from "./smooch-recipes";

export const SmoochConfig = object({
    ...SmoochRecipes.getRecipeConfigs(),
    global: object({
        endOfLineSequence: enums(["crlf", "lf", "os"]),
    }),
});

export type SmoochConfigType = Infer<typeof SmoochConfig>;
