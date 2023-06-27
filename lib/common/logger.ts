import chalk from "chalk";
import { ForegroundColor } from "chalk";

export class Logger {
    constructor(readonly context: any, readonly color: typeof ForegroundColor) {
        
    }

    private get _prefix() {
        return chalk[this.color]`${padLeftWithSpaces(getPrintableContext(this.context))} `;
    }

    log(message: any, ...additional: any[]) {
        this._print('log', message, additional);
    }

    debug(message: any, ...additional: any[]) {
        this._print('debug', message, additional);
    }

    error(message: any, ...additional: any[]) {
        this._print('error', message, additional);
    }

    warn(message: any, ...additional: any[]) {
        this._print('warn', message, additional);
    }

    private _print(key: 'log' | 'error' | 'warn' | 'debug', message: any, additional: any[]) {
        console[key](`${this._prefix}${message}`, ...additional);
    }
}

const maxLength = 30;
const spaces = new Array(maxLength).map(() => '').join(' ');

function padLeftWithSpaces(source: string) {
    const padded = spaces + eliminateVowels(source);
    return padded.substring(padded.length - maxLength, padded.length);
}

function eliminateVowels(source: string) {
    if (source.length <= maxLength)
        return source;
    
    const characters = [...source];
    let eliminateCount = characters.length - maxLength;
    for (let i = 0; i < characters.length; i++) {
        const character = characters[i];
        const nextCharacter = eliminateVowel(character);
        if (nextCharacter !== character) {
            characters[i] = nextCharacter;
            eliminateCount -= 1;
        }
        if (eliminateCount <= 0)
            break;
    }
    return characters.join('');
}

function eliminateVowel(character: string) {
    switch (character.toLowerCase()) {
        case 'a':
        case 'e':
        case 'i':
        case 'o':
        case 'u':
            return '';
        default:
            return character;
    }
}

function getPrintableContext(context: any): string {
    if (context instanceof Function)
        return context.name;

    let str: string = context.toString();
    if (str.charAt(0) === '[')
        str = str.substring(1);
    if (str.charAt(str.length - 1) === ']')
        str = str.substring(0, str.length - 1);

    return str;
}