import { EOL } from 'os'

export type EndOfLineSequence = 'crlf' | 'lf' | 'os';

const endOfLineSequenceRegexp = /\r?\n/g;

const endOfLineSequenceToCharacter = {
    crlf: '\r\n',
    lf: '\n',
    os: EOL,
} satisfies Record<EndOfLineSequence, string>

export const forceEndOfLineSequence = (text: string, lineEnding: EndOfLineSequence) => {
    if (!text.endsWith('\n')) {
        text += '\n';
    }
    return text.replace(endOfLineSequenceRegexp, endOfLineSequenceToCharacter[lineEnding]);
};
