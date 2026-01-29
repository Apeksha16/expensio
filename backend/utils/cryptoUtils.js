const crypto = require('crypto');
const argon2 = require('argon2');

let publicKey = null;
let privateKey = null;

// Generate RSA Key Pair (2048-bit)
const generateKeyPair = () => {
    if (publicKey && privateKey) return { publicKey, privateKey };

    console.log('Generating RSA Key Pair...');
    const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    publicKey = pub;
    privateKey = priv;
    console.log('RSA Key Pair generated successfully.');

    return { publicKey, privateKey };
};

// Decrypt using Private Key
const decryptData = (encryptedData) => {
    if (!privateKey) {
        throw new Error('Private Key not initialized');
    }

    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            buffer
        );
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
};

// Hash data using Argon2
const hashData = async (data) => {
    try {
        return await argon2.hash(data);
    } catch (error) {
        console.error('Hashing failed:', error);
        throw error;
    }
};

// Verify hash using Argon2
const verifyHash = async (hash, data) => {
    try {
        return await argon2.verify(hash, data);
    } catch (error) {
        console.error('Verification failed:', error);
        return false;
    }
};

// Initialize keys on start
generateKeyPair();

module.exports = {
    getPublicKey: () => publicKey,
    decryptData,
    hashData,
    verifyHash
};
