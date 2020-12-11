const assert = require('assert');
const request = require("./Util/request").request;
const app = require('../app');
const crypt = require('../routes/Util/crypt');
const mysql = require('mysql');

// @TODO create test db and change hard coded localhost to test db.

describe('User Backend Tests:', function () {
    let server;

    // gets the config settings for the db
    const sqlConfig = {
        user: process.env.SQL_USERNAME,
        password: process.env.SQL_PASSWORD,
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT,
        database: process.env.SQL_DATABASE
    };

    // creates a pool to handle query requests.
    const pool = mysql.createPool(sqlConfig);

    this.beforeAll(() => {
        server = app.listen(3000, async function () { });
    });

    this.afterAll(() => {
        server.close();
        delete pool;
    });

    describe('#addRoute', function () {
        it('Tests adding a user?', async function () {
            let data = JSON.stringify({ username: "username1", password: "Password1*", email: "email1@email.com" });

            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/add',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data, 'utf-8')
                }
            };

            let resp = await request(options, data).catch((err) => {
                console.log(err);
                return -1;
            });
            assert.equal(true, resp.success);

            let resp2 = await request(options, data).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal(false, resp2.success);

            // add admin
            let data2 = JSON.stringify({ username: "AdminUser", password: "Password1*", email: "email1@email.com" });

            let options2 = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/add',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data, 'utf-8')
                }
            };

            let resp3 = await request(options2, data2, false);
            assert.equal(true, resp3.success);

            await new Promise(async (resolve, reject) => {
                const key = crypt.getKeyFromPassword(process.env.USER_ENCRYPT_PASSWORD, Buffer.from(process.env.USER_ENCRYPT_SALT));
                const query = 'UPDATE User SET accessLevel = 1 WHERE username = ? AND password = ?;';

                let username = await crypt.encrypt('AdminUser', key);
                let password = await crypt.encrypt('Password1*', key);


                const values = [username, password];
                pool.query(query, values, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                })
            }).catch((err) => {
                console.log(err);
            });
        });
    });

    describe('#LoginRoute', function () {
        it('Tests logging in a user?', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/login?username=username1&password=Password1*',
                method: 'GET',
            };

            let resp = await request(options);
            options.path = '/user/login?username=username1&password=Password1';
            let resp2 = await request(options);

            assert.equal(true, resp.success);
            assert.equal(false, resp2.success);

        });
    });

    describe('#LogoutRoute', function () {
        it('Tests logging out a user?', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/login?username=username1&password=Password1*',
                method: 'GET',
            };

            let optionsUserId = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/getUserId',
                method: 'GET',
            };

            let resp = await request(options);
            assert.equal(true, resp.success);

            options.path = '/user/logout'
            await request(options, null, false, false);
            let resp2 = await request(optionsUserId);
            console.log(resp2);
            assert.equal(false, resp2.success);
        });
    });

    describe('#updateRoute', function () {
        it('Tests updating a user?', async function () {
            let optionsLogin = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/login?username=username1&password=Password1*',
                method: 'GET',
            };

            await request(optionsLogin, null, true).then(async function (temp) {
                let data = JSON.stringify({ username: "username16", password: "Password1*", email: "email1@email.com" });
                let options = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/user/update',
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data, 'utf-8'),
                        'cookie': temp.headers[0]
                    }
                };

                let resp = await request(options, data).catch((err) => {
                    console.log(err);
                    return -1;
                });
                assert.equal(true, resp.success);
            });
        });
    });

    describe('#getAndDelete', function () {
        it('Tests getting a user by username and deleting them?', async function () {
            let optionsLogin = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/login?username=AdminUser&password=Password1*',
                method: 'GET',
            };

            await request(optionsLogin, null, true).then(async function (temp) {
                let optionsGet = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/user/get?username=username16',
                    method: 'GET',
                    headers: {
                        'cookie': temp.headers[0]
                    }
                };

                let resp = await request(optionsGet, null, false).catch((err) => {
                    console.log(err);
                    return -1;
                });
                assert.equal(true, resp.userId > -1);

                let data = JSON.stringify({ userId: resp.userId });
                let optionsBan = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/user/ban',
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data, 'utf-8'),
                        'cookie': temp.headers[0]
                    }
                };

                let resp2 = await request(optionsBan, data, false).catch((err) => {
                    console.log(err);
                    return -1;
                });

                assert.equal(true, resp2.success);

                let resp3 = await request(optionsGet, null, false).catch((err) => {
                    console.log(err);
                    return -1;
                });
                assert.equal(false, resp3.userId > -1);
            });
        });
    });

    describe('#getAccountInfo', function () {
        it("Tests displaying a user's account information?", async function () {
            let optionsLogin = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/login?username=AdminUser&password=Password1*',
                method: 'GET',
            };

            await request(optionsLogin, null, true).then(async function (temp) {
                let options = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/user/',
                    method: 'get',
                    headers: {
                        'cookie': temp.headers[0]
                    }
                };

                let resp = await request(options, null, false).catch((err) => {
                    console.log(err);
                    return -1;
                });
                assert.equal(true, resp.username == 'AdminUser');
                assert.equal(true, resp.password == 'Password1*');
                assert.equal(true, resp.email == 'email1@email.com')
            });
        });
    });

    describe('#removeRoute', function () {
        it('Tests removing a user?', async function () {
            let optionsLogin = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/login?username=AdminUser&password=Password1*',
                method: 'GET',
            };

            await request(optionsLogin, null, true).then(async function (temp) {
                let data = JSON.stringify({ password: "Password1*" });
                let options = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/user/remove',
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data, 'utf-8'),
                        'cookie': temp.headers[0]
                    }
                };

                let resp = await request(options, data).catch((err) => {
                    console.log(err);
                    return -1;
                });
                assert.equal(true, resp.success);
            });
        });
    });
});