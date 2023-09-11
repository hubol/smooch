import { SmoochConfigType } from "./smooch-config";

let _value: SmoochConfigType;

export const SmoochConfigSingleton = {
    get value() {
        return _value;
    },
    set(value: SmoochConfigType) {
        _value = value;
    }
}