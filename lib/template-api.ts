import { Utils } from "./common/template";
import { AggregateJsonTemplateContext } from "./json/aggregate-json";
import { ConvertAudioTemplateContext } from "./audio/convert-audio";
import { PackTextureTemplateContext } from "./texturepack/src/texture-pack";

export { Utils };

export namespace TemplateContext {
    export type JsonAggregate = AggregateJsonTemplateContext;
    export type AudioConvert = ConvertAudioTemplateContext;
    export type TexturePack = PackTextureTemplateContext;
}