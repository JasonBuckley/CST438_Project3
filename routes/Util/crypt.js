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

/**
 * Converts string into buffer for salt
 * @param {String} salt
 * returns Buffer containing salt
 */
function getSalt(salt) {
    return Buffer.from(salt);
}

/**
 * Given a string and salt buffer this method creates an iv
 * @param {String} password
 * @param {Buffer} salt
 * @returns Buffer containing iv
 */
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

/**
 * Given a password and a salt this method produces a encryption key
 * @param {String} password
 * @param {Buffer} salt
 * @returns Buffer containing encryption key
 */
function getKeyFromPassword(password, salt) {
    return crypto.scryptSync(password, salt, ALGORITHM.KEY_LEN);
}

/**
 * Given a plain text message it encrypts it using aes-256-gcm encryption. 
 * @param {String} message
 * @param {Buffer} key
 * @returns Buffer containing encrypted message
 */
async function encrypt(message, key) {
    const iv = await getIV(message, getSalt(ivSalt));
    const cipher = crypto.createCipheriv(ALGORITHM.ALGORITHM, key, iv, {
        authTagLength: ALGORITHM.AUTH_TAG_LEN
    });
    let encryptedMessage = cipher.update(message);
    encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
    return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
}

/**
 * Given an encrypted text message it decrpts it using aes-256-gcm encryption
 * @param {Buffer} ciphertext
 * @param {Buffer} key
 * @returns Buffer containing decrypted message
 */
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

/**
 * Converts an array of data into a buffer.
 * @param {Array} data
 * returns Buffer
 */
function arrayToBuffer(data) {
    return Buffer.from(data);
}

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.getIV = getIV;
module.exports.getKeyFromPassword = getKeyFromPassword;
module.exports.getSalt = getSalt;
module.exports.arrayToBuffer = arrayToBuffer;