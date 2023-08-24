import { Utils } from "./common/template";
import { AggregateJsonTemplateContext } from "./json/aggregate-json";
import { ConvertAudioTemplateContext } from "./audio/convert-audio";
import { PackTextureTemplateContext } from "./texturepack/src/texture-pack";

export { Utils };

export namespace TemplateContext {
    export type AggregateJson = AggregateJsonTemplateContext;
    export type ConvertAudio = ConvertAudioTemplateContext;
    export type PackTexture = PackTextureTemplateContext;
}