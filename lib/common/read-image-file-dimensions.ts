import { promisify } from "util";
import imageSizeExport from "image-size";

export const readImageFileDimensions = promisify(imageSizeExport);
