// https://stackoverflow.com/questions/69327990/how-can-i-make-one-property-non-optional-in-a-typescript-type#comment130984343_69328045
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
