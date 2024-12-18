export const Now = {
    get ms() {
        return Date.now();
    },
    get s() {
        return Date.now() / 1000;
    },
};
