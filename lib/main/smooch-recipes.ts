import { Struct, array, defaulted } from "superstruct";
import { TexturePackRecipe } from "../texturepack/src/texture-pack";
import { AggregateJsonRecipe } from "../json/aggregate-json";
import { SmoochWorkPipelineRecipe } from "./pipeline/smooch-work-pipeline";

const recipes = {
    jsonFiles: AggregateJsonRecipe,
    textures: TexturePackRecipe,
}

function getRecipeConfigs(): RecipeToConfigSchema<typeof recipes> {
    const obj = {};
    for (const key in recipes)
        obj[key] = getRecipeConfig(recipes[key].configSchema);

    return obj as any;
}

export const SmoochRecipes = {
    available: recipes,
    getRecipeConfigs,
}

function getRecipeConfig<T extends Struct<any, unknown>>(recipe: SmoochWorkPipelineRecipe<T>) {
    return defaulted(array(recipe.configSchema), []);
}

type RecipeToConfigSchema<T> = {
    [k in keyof T]: T[k] extends SmoochWorkPipelineRecipe<infer E extends Struct<any, any>>
        ? ReturnType<typeof getRecipeConfig<T[k]['configSchema']>>
        : never;
};