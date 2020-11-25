const assert = require('assert');
const request = require("./Util/request").request;
const app = require('../app');

// @TODO create test db and change hard coded localhost to test db.

describe('User Backend Tests:', function () {
    let server;
    this.beforeAll(() => {
        server = app.listen(3000, async function () { });
    });

    this.afterAll(() => {
        server.close();
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
            assert.equal(true, resp.insertId > -1);

            let resp2 = await request(options, data).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal(false, resp2.insertId > -1);
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

            let resp = await request(options);
            assert.equal(true, resp.success);

            options.path = '/user/logout'
            let resp2 = await request(options);
            assert.equal(true, resp2.success);
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

    describe('#removeRoute', function () {
        it('Tests removing a user?', async function () {
            let optionsLogin = {
                hostname: 'localhost',
                port: 3000,
                path: '/user/login?username=username16&password=Password1*',
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