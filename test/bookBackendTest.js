const assert = require('assert');
const http = require("http");
const mysql = require('mysql');
const app = require('../app');

// @TODO create test db and change hard coded localhost to test db.

describe('Book Backend Tests:', function () {
    let server;
    this.beforeAll(() => {
        server = app.listen(3000, async function () { });
    });

    // cleans up db and closes server.
    this.afterAll(async () => {
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
        const query = 'DELETE FROM Book WHERE isbn13 = ?';
        const values = ['9780765378484'];

        await new Promise((resolve, reject) => {
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
                    'Content-Length': Buffer.byteLength(data, 'utf-8')
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
});

function request(options, body, needHeader) {
    return new Promise((resolve, reject) => {
        let req = http.request(options, (res) => {
            let body = "";

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode != "200" && (body && res.statusCode != 302)) {
                    reject("Call to api end point has failed with response code " + res.statusCode);
                } else {
                    try {
                        let data = JSON.parse(body);
                        if (needHeader) {
                            resolve({ data: data, headers: res.headers['set-cookie'] });
                        } else {
                            resolve(data);
                        }
                    } catch (e) {
                        reject('Error parsing JSON!');
                    }

                }
            });

            res.on('error', (err) => {
                reject(err);
            });
        });

        if (body) {
            req.write(body);
        }

        req.end();
    });
}
