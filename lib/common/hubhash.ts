// Very naive hashing algorithm
export function hubhash(src: string, hashLength = 16) {
    const bytes = encoder.encode(src);
    const bytesLength = bytes.byteLength;

    const sums = [...new Array(hashLength)].map(() => 0);
    let bytesIndex = 0;

    while (bytesIndex < bytesLength) {
        const byte = bytes[bytesIndex] || 0;
        sums[bytesIndex % sums.length] += byte;
        sums[(bytesIndex + 1) % sums.length] += byte % 4;
        sums[(bytesIndex + 2) % sums.length] += byte % 3;
        sums[(bytesIndex + 3) % sums.length] += byte % 2;
        bytesIndex += 1;
    }

    let result = "";
    for (let i = 0; i < sums.length; i++) {
        const sum = sums[i];
        result += characters[sum % characters.length];
    }

    return result;
}

const encoder = new TextEncoder();
const characters = ["h", "u", "b", "o", "l"];
