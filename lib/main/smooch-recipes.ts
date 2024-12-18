import { Struct, array, defaulted } from "superstruct";
import { TexturePackRecipe } from "../texturepack/src/texture-pack";
import { AggregateJsonRecipe } from "../json/aggregate-json";
import { SmoochWorkPipelineRecipe } from "./pipeline/smooch-work-pipeline";
import { ConvertAudioRecipe } from "../audio/convert-audio";

const recipes = {
    jsonFiles: AggregateJsonRecipe,
    textures: TexturePackRecipe,
    audioFiles: ConvertAudioRecipe,
};

function getRecipeConfigs(): RecipeToConfigSchema<typeof recipes> {
    const obj = {};
    for (const key in recipes) {
        obj[key] = getRecipeConfig(recipes[key]);
    }

    return obj as any;
}

export const SmoochRecipes = {
    available: recipes,
    getRecipeConfigs,
};

function getRecipeConfig<T extends Struct<any, unknown>>(recipe: SmoochWorkPipelineRecipe<T>) {
    return defaulted(array(recipe.configSchema), []);
}

type RecipeToConfigSchema<T> = {
    [k in keyof T]: T[k] extends SmoochWorkPipelineRecipe<infer E extends Struct<any, any>>
        ? ReturnType<typeof getRecipeConfig<T[k]["configSchema"]>>
        : never;
};
