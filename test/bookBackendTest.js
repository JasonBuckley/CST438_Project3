const assert = require('assert');
const request = require("./Util/request").request;
const crypt = require("../routes/Util/crypt");
const mysql = require('mysql');
const app = require('../app');

describe('Book Backend Tests:', function () {
    let server;
    let userSession;
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

    this.beforeAll(async () => {
        server = await app.listen(3000, async function () { });

        let data = JSON.stringify({ username: "bookTestUser", password: "Password1*", email: "email1@email.com" });

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

        await request(options, data, false);

        await new Promise(async (resolve, reject) => {
            const key = crypt.getKeyFromPassword(process.env.USER_ENCRYPT_PASSWORD, Buffer.from(process.env.USER_ENCRYPT_SALT));
            const query = 'UPDATE User SET accessLevel = 1 WHERE username = ? AND password = ?;';

            let username = await crypt.encrypt('bookTestUser', key);
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

        let optionsLogin = {
            hostname: 'localhost',
            port: 3000,
            path: '/user/login?username=bookTestUser&password=Password1*',
            method: 'GET',
        };

        userSession = await request(optionsLogin, null, true);
    });

    // cleans up db and closes server.
    this.afterAll(async () => {
        let data = JSON.stringify({ password: "Password1*" });
        let options = {
            hostname: 'localhost',
            port: 3000,
            path: '/user/remove',
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data, 'utf-8'),
                'cookie': userSession.headers[0]
            }
        };

        await request(options, data).catch((err) => {
            console.log(err);
            return -1;
        });

        delete pool;
        server.close();
    });

    describe('#addRoute', function () {
        it('Tests adding a Book?', async function () {
            let data = JSON.stringify({ isbn: "9780765378484" });
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/book/add',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data, 'utf-8'),
                    'cookie': userSession.headers[0]
                }
            };

            let data2 = JSON.stringify({ isbn: "0517226952" });
            let options2 = {
                hostname: 'localhost',
                port: 3000,
                path: '/book/add',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data2, 'utf-8'),
                    'cookie': userSession.headers[0]
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

            let resp3 = await request(options2, data2).catch((err) => {
                console.log(err);
                return -1;
            });
            assert.equal(true, resp3.success);
        });
    });

    describe('#GetPageRoute', function () {
        it('Tests getting a book\'s information?', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/book/page?isbn=9780765378484&format=JSON',
                method: 'GET',
            }

            let resp = await request(options, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal("Ender's Game", resp.book.name);
            assert.equal("Orson Scott Card", resp.book.author);
            assert.equal(3, resp.genres.length);
        });
    });

    describe('#FilterTest', function () {
        it('Tests getting a book by search query', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/book?search=HitchHiker%27s%20guide',
                method: 'GET',
            }

            let resp = await request(options, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal('0517226952', resp[0].ISBN10);
        });

        it('Tests getting a book by category', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/book?categories=fiction',
                method: 'GET',
            }

            let resp = await request(options, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal(2, resp.length);
            assert.equal(true, [resp[0].ISBN10, resp[1].ISBN10].includes('0517226952'));

            let options2 = {
                hostname: 'localhost',
                port: 3000,
                path: '/book?categories=humour',
                method: 'GET',
            }

            let resp2 = await request(options2, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal('0517226952', resp2[0].ISBN10);
        });

        it('Tests getting a book by search key and category', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/book?search=ender&categories=science%2Chumour',
                method: 'GET',
            }

            let resp = await request(options, null, false).catch((err) => {
                console.log(err);
                return -1;
            });


            console.log(resp);
            let title = resp && resp.length ? resp[0].ISBN13 : '';
            assert.equal('9780765378484', title);
        });


        it('Tests getting a book by ISBN', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/book?isbn=9780765378484',
                method: 'GET',
            }

            let resp = await request(options, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            console.log(resp);
            assert.equal('Ender\'s Game', resp[0].name);
        });
    });



    describe('#updateRoute', function () {
        it('Tests update a Book?', async function () {
            let options = {
                hostname: 'localhost',
                port: 3000,
                path: '/book/page?isbn=9780765378484&format=JSON',
                method: 'GET',
            }

            let resp = await request(options, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            let data = JSON.stringify({ author: "author", title: "wrong one", publisher: "new guy", bookId: resp.book.bookId });
            let options2 = {
                hostname: 'localhost',
                port: 3000,
                path: '/book/update',
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data, 'utf-8'),
                    'cookie': userSession.headers[0]
                }
            };

            let resp2 = await request(options2, data).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal(true, resp2.success);

            let resp3 = await request(options, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal("author", resp3.book.author);
            assert.equal("wrong one", resp3.book.name);
            assert.equal("new guy", resp3.book.publisher);
            assert.notEqual(resp.book.name, resp3.book.name);

            let same = true;
            let genres1 = resp.genres;
            let genres2 = resp3.genres;

            if (genres1.length == genres2.length) {
                for (var i = 0; i < genres1.length; i++) {
                    if (genres1[i].genre != genres2[i].genre) {
                        same = false;
                        break;
                    }
                }
            } else {
                same = false;
            }

            assert.equal(true, same);
        });
    });


    describe('#deleteRoute', function () {
        it('Tests deleting a Book?', async function () {
            let options1 = {
                hostname: 'localhost',
                port: 3000,
                path: '/book?isbn=0517226952',
                method: 'get',
            }

            let options2 = {
                hostname: 'localhost',
                port: 3000,
                path: '/book?isbn=9780765378484',
                method: 'get',
            }

            let resp1 = await request(options1, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            let resp2 = await request(options2, null, false).catch((err) => {
                console.log(err);
                return -1;
            });

            let data1 = JSON.stringify({ bookId: resp1[0].bookId });
            let options3 = {
                hostname: 'localhost',
                port: 3000,
                path: '/book/remove',
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data1, 'utf-8'),
                    'cookie': userSession.headers[0]
                }
            }

            let data2 = JSON.stringify({ bookId: resp2[0].bookId });
            let options4 = {
                hostname: 'localhost',
                port: 3000,
                path: '/book/remove',
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data2, 'utf-8'),
                    'cookie': userSession.headers[0]
                }
            }

            let resp3 = await request(options3, data1, false).catch((err) => {
                console.log(err);
                return -1;
            });

            let resp4 = await request(options4, data2, false).catch((err) => {
                console.log(err);
                return -1;
            });

            assert.equal(true, resp3.success);
            assert.equal(true, resp4.success);
        });
    });
});