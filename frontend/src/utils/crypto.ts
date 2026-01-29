import forge from 'node-forge';

export const encryptData = (data: string, publicKeyPem: string): string => {
    try {
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const encrypted = publicKey.encrypt(data, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create(),
            },
        });
        return forge.util.encode64(encrypted);
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};
