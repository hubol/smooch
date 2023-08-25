import { Infer, defaulted, object } from "superstruct";
import { SmoochStruct } from "../common/custom-superstruct";
import { SmoochRecipes } from "./smooch-recipes";

const CoreConfig = object({
    cacheFolder: defaulted(SmoochStruct.DirectoryPath, '.smooch'),
})

export const SmoochConfig = object({
    core: CoreConfig,
    ...SmoochRecipes.getRecipeConfigs(),
});

export type SmoochConfigType = Infer<typeof SmoochConfig>;