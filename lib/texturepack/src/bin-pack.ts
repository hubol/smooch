import { Bin, MaxRectsPacker } from "maxrects-packer";
import { BinPackOptions } from "./options";

export const binPack = <T extends { width: number; height: number }>(
    input: T[],
    packOptions: typeof BinPackOptions["TYPE"],
): Bin<(T & { x: number; y: number })>[] => {
    const { padding, maxWidth, maxHeight, smart, pot, square } = packOptions;
    const options = {
        smart,
        pot,
        square,
        allowRotation: false,
        tag: false,
        border: 0,
    }; // Set packing options
    const packer = new MaxRectsPacker(maxWidth, maxHeight, padding, options);

    packer.addArray(input as any);
    return packer.bins as any;
};
