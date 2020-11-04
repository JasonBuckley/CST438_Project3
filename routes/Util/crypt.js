const crypto = require("crypto");
const { Buffer } = require("buffer");

let ivSalt = process.env.ENCRYPT_IV_SALT;

const ALGORITHM = {
    ALGORITHM: 'aes-256-gcm',
    AUTH_TAG_LEN: 16,
    IV_LEN: 12,
    KEY_LEN: 32,
    SALT_LEN: 16,
    DIGEST: 'sha512',
    ROUNDS: 10000
};

function getSalt(salt) {
    return Buffer.from(salt);
}

function getIV(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, ivSalt, ALGORITHM.ROUNDS, ALGORITHM.IV_LEN, ALGORITHM.DIGEST, (err, derivedKey) => {
            if (err) {
                reject(err);
            } else {
                resolve(derivedKey);
            }
        });
    }).catch((err) => {
        console.log(err);
    });
}

function getKeyFromPassword(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, ALGORITHM.KEY_LEN, (err, derivedKey) => {
            if (err) {
                reject(err);
            } else {
                resolve(derivedKey);
            }
        });
    }).catch((err) => {
        console.log(err);
    });
}

async function encrypt(message, key) {
    const iv = await getIV(message, getSalt(ivSalt));
    const cipher = crypto.createCipheriv(ALGORITHM.ALGORITHM, key, iv, {
        authTagLength: ALGORITHM.AUTH_TAG_LEN
    });
    let encryptedMessage = cipher.update(message);
    encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
    return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
}

async function decrypt(ciphertext, key) {
    const authTag = ciphertext.slice(-16);
    const iv = ciphertext.slice(0, 12);
    const encryptedMessage = ciphertext.slice(12, -16);
    const decipher = crypto.createDecipheriv(ALGORITHM.ALGORITHM, key, iv, {
        authTagLength: ALGORITHM.AUTH_TAG_LEN
    });
    decipher.setAuthTag(authTag);
    const messagetext = decipher.update(encryptedMessage);
    return Buffer.concat([messagetext, decipher.final()]);
}

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.getIV = getIV;
module.exports.getKeyFromPassword = getKeyFromPassword;
module.exports.getSalt = getSalt;