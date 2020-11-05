var express = require('express');
var router = express.Router();
const mysql = require("mysql");
const crypt = require("../routes/Util/crypt");

const KEY = crypt.getKeyFromPassword("password", Buffer.from("salt"));

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

router.get('/login', async function (req, res, next) {
    if (!req.query.username && !req.query.password) {
        return res.render('loginPage');
    }

    const query = 'SELECT * FROM User WHERE username = ? AND password = ? LIMIT 1;';

    let username = await crypt.encrypt(req.query.username, KEY);
    let password = await crypt.encrypt(req.query.password, KEY);

    const values = [username, password];

    let user = await new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });

    if (Array.isArray(user) && user.length) {
        req.session.user = user[0];
        return res.json({ success: true });
    } else {
        delete req.session.user;
        return res.json({ success: false });
    }
});

/**
 * Adds a user given they provide a valid username, password, and email.
 */
router.post('/add', async function (req, res, next) {
    if (!req.body.username && !req.body.password && !req.body.email) {
        return res.json({ failed: "failed" });
    }

    let username = await crypt.encrypt(req.body.username, KEY);
    let password = await crypt.encrypt(req.body.password, KEY);
    let email = await crypt.encrypt(req.body.email, KEY);

    insertId = await checkusername(username)
        .then(() => addUser(username, password, email))
        .catch((err) => {
            if (err === "Username already used") {
                return -1;
            } else {
                console.log(err)
                return -2;
            }
        });

    return res.json({ insertId: insertId });
});

/**
 * Checks if username is valid and not already in use.
 * @param {any} username
 */
async function checkusername(username) {
    const query = 'SELECT * FROM User WHERE username = ? LIMIT 1;';
    const values = [username];

    return new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (Array.isArray(results) && results.length > 0 && results[0].userID > -1) {
                    reject("Username already used");
                }

                resolve();
            }
        });
    });
};

/**
 * Adds a user the User table in the db.
 * @param {any} username
 * @param {any} password
 * @param {any} email
 */
async function addUser(username, password, email) {
    const query = 'INSERT INTO User VALUES(NULL, ?, ?, ?);';
    const values = [username, password, email];

    return new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

/**
 * Gets user information 
 */
router.get('/', async function (req, res, next) {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }

    username = (await crypt.decrypt(crypt.arrayToBuffer(req.session.user.username), KEY)).toString('utf-8');
    password = (await crypt.decrypt(crypt.arrayToBuffer(req.session.user.password.data), KEY)).toString('utf-8');
    email = (await crypt.decrypt(crypt.arrayToBuffer(req.session.user.email.data), KEY)).toString('utf-8');

    return res.json({ username: username, password: password, email: email });
});

module.exports = router;