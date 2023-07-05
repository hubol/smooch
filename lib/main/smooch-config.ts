import { Infer, object } from "superstruct";
import { SmoochStruct } from "../common/custom-superstruct";
import { SmoochRecipes } from "./smooch-recipes";

const CoreConfig = object({
    cacheFolder: SmoochStruct.CwdRelativePath,
})

export const SmoochConfig = object({
    core: CoreConfig,
    ...SmoochRecipes.getRecipeConfigs(),
});

export type SmoochConfigType = Infer<typeof SmoochConfig>;