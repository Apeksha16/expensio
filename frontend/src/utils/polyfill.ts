import * as Crypto from 'expo-crypto';

// Polyfill for crypto.getRandomValues using expo-crypto
if (typeof global.crypto !== 'object') {
  (global as any).crypto = {};
}

if (typeof (global as any).crypto.getRandomValues !== 'function') {
  (global as any).crypto.getRandomValues = (array: any) => {
    return Crypto.getRandomValues(array);
  };
}
