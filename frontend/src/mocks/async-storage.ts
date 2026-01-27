
const AsyncStorage = {
    getItem: async (key: string) => {
        return window.localStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
        window.localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        window.localStorage.removeItem(key);
    },
    clear: async () => {
        window.localStorage.clear();
    },
    getAllKeys: async () => {
        return Object.keys(window.localStorage);
    },
    multiGet: async (keys: string[]) => {
        return keys.map(key => [key, window.localStorage.getItem(key)]);
    },
    multiSet: async (kvPairs: string[][]) => {
        kvPairs.forEach(([key, value]) => window.localStorage.setItem(key, value));
    },
    multiRemove: async (keys: string[]) => {
        keys.forEach(key => window.localStorage.removeItem(key));
    }
};

export default AsyncStorage;
