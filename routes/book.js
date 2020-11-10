var express = require('express');
var router = express.Router();
const mysql = require("mysql");
const https = require("https");

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

router.get("/", async function (req, res, next) {
    if (req.query.search) {
        next();
        return;
    }

    let result = await new Promise((resolve, reject) => {
        const query = 'SELECT * FROM Book LIMIT 25';

        pool.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                console.log(results);
                resolve(results);
            }
        });
    });

    return res.json(result);
});

router.get("/", async function (req, res, next) {
    let result = await new Promise((resolve, reject) => {
        const query = `SELECT * FROM Book WHERE name LIKE ${pool.escape('%' + req.query.search + '%')} LIMIT 25;`;
        const values = [req.query.search];

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });

    return res.json(result);
});

router.post("/add", async function (req, res, next) {
    if (!req.body.isbn) {
        res.json({ success: false });
    }

    const url = new URL("https://openlibrary.org/api/books?bibkeys=ISBN:" + req.body.isbn + "&jscmd=data&format=json");

    let result = await request(url)
        .then((data) => addBook(data))
        .catch((err) => {
            console.log(err);
            return -1;
        });

    return res.json({ success: result > -1 });
});

function addBook(data) {
    return new Promise((resolve, reject) => {
        if (!data) {
            reject("Book not found");
        }

        let author = data.authors ? data.authors[0].name : "Unknown";
        let title = data.title;
        let coverImg = data.cover ? data.cover.medium : "None";
        let isbn = data.identifiers.isbn_13 ? data.identifiers.isbn_13[0] : data.identifiers.isbn_10[0];
        let publisher = data.publishers[0] ? data.publishers[0].name : "Unknown";

        const query = 'INSERT INTO Book VALUES(null, ?, ?, ?, ?, ?);';
        const values = [title, author, coverImg, isbn, publisher];

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

function request(url) {
    return new Promise((resolve, reject) => {
        let req = https.request(url, (res) => {
            let body = "";

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode != "200") {
                    reject("Call to api end point has failed with response code " + res.statusCode);
                } else {
                    try {
                        let data = JSON.parse(body);
                        resolve(data[Object.keys(data)[0]]);
                    } catch (e) {
                        reject('Error parsing JSON!');
                    }

                }
            });

            res.on('error', (err) => {
                reject(err);
            });
        });

        req.end();
    });
}

module.exports = router;