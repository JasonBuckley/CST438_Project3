const assert = require('assert');
const crypt = require('../routes/Util/crypt');

describe('Encrpytion Tests:', function () {
    describe('#getSalt(salt)', function () {
        it('Given a string should return a buffer containing salt.', function () {
            assert.equal(true, Buffer.isBuffer(crypt.getSalt("salt")));
        });
    });

    describe('#getIV(password, salt)', function () {
        it('Given a string, and buffer should return a buffer containing iv.', async function () {
            let iv = await crypt.getIV("password", Buffer.isBuffer(crypt.getSalt("salt")));
            assert.equal(true, Buffer.isBuffer(iv) && iv.length == 12);
        });
    });

    describe("#getKeyFromPassword(password, salt)", function () {
        it('Given a string, and string should return a buffer containing key.', async function () {
            let key = await crypt.getKeyFromPassword("password", "salt");
            assert.equal(true, Buffer.isBuffer(key) && key.length == 32);
        });
    });

    describe("#encrypt(message, key)", function () {
        it('Given a string, and buffer should return a buffer containing encrypted message.', async function () {
            let key = await crypt.getKeyFromPassword("password", "salt");
            let message = "hello world";
            let encrypted = await crypt.encrypt(message, key);
            assert.equal(true, Buffer.isBuffer(encrypted) && encrypted.length == 39);
        });
    });

    describe("#decrypt(ciphertext, key)", function () {
        it('Given a buffer, and buffer should return a buffer containing decrypted message.', async function () {
            let key = await crypt.getKeyFromPassword("password", "salt");
            let message = "hello world";
            let encrypted = await crypt.encrypt(message, key);
            let decrypted = (await crypt.decrypt(encrypted, key)).toString('utf-8');
            assert.equal(true, decrypted === message);
        });
    });
});
