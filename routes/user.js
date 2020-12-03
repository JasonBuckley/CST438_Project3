var express = require('express');
var router = express.Router();
const mysql = require("mysql");
const crypt = require("../routes/Util/crypt");
const { Buffer } = require("buffer");
const { access } = require('fs');

const KEY = crypt.getKeyFromPassword(process.env.USER_ENCRYPT_PASSWORD, Buffer.from(process.env.USER_ENCRYPT_SALT));

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

/**
 * Attempts to log a user into the website. Either returns true if successful, or false if unsuccessful.
 */
router.get('/login', async function (req, res, next) {
    if (!req.query.username || !req.query.password) {
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
 * Logs a user out of the website.
 */
router.get('/logout', async function (req, res, next) {
    delete req.session.user;
    return res.json({ success: true });
});

/**
 * Adds a user given they provide a valid username, password, and email.
 */
router.post('/add', async function (req, res, next) {
    if (!req.body.username || !req.body.password || !req.body.email) {
        return res.json({ failed: "failed" });
    }

    let username = await crypt.encrypt(req.body.username, KEY);
    let password = await crypt.encrypt(req.body.password, KEY);
    let email = await crypt.encrypt(req.body.email, KEY);

    let insertId = await checkUsername(username, req.body.username)
        .then(() => checkPassword(req.body.password))
        .then(() => checkEmail(req.body.email))
        .then(() => addUser(username, password, email))
        .catch((err) => {
            if (err === "Username already used" || err === "Invalid Password" || err === "Invalid Username" || err === "Invalid Email") {
                console.log(err)
                return -1;
            } else {
                console.log(err)
                return -2;
            }
        });

    return res.json({ insertId: insertId });
});
router.get('/register', function (req, res) {
    res.render('register');
});


/**
 * Updates a User's account info given a valid password, username, and email.
 */
router.put('/update', async function (req, res, next) {
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.body.username && !req.body.password && !req.body.email) {
        return res.json({ success: false });
    }

    let username = req.body.username ? await crypt.encrypt(req.body.username, KEY) : "";
    let password = req.body.password ? await crypt.encrypt(req.body.password, KEY) : "";
    let email = req.body.email ? await crypt.encrypt(req.body.email, KEY) : "";

    let result = await (username && Buffer.compare(username, crypt.arrayToBuffer(req.session.user.username)) ? checkUsername(username, req.body.username) : new Promise((resolve, reject) => { resolve("Success") }))
        .then(() => password ? checkPassword(req.body.password) : new Promise((resolve, reject) => { resolve("Success") }))
        .then(() => email ? checkEmail(req.body.email) : new Promise((resolve, reject) => { resolve("Success") }))
        .then(() => updateUser(username, password, email, req.session.user))
        .catch((err) => {
            if (err === "Username already used" || err === "Invalid Password" || err === "Invalid Username" || err === "Invalid Email") {
                console.log(err)
                return -1;
            } else {
                console.log(err)
                return -2;
            }
        });

    if (result.affectedRows > 0) {
        req.session.user.username = result.username;
        req.session.user.password = result.password;
        req.session.user.email = result.email;
    }

    return res.json({ success: result.affectedRows > 0 });
});

/**
 * Given a valid password and user with a session this route removes there account.
 */
router.delete('/remove', async function (req, res, next) {
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.body.password) {
        return res.json({ success: false });
    }

    let password = await crypt.encrypt(req.body.password, KEY);
    let insertId = await deleteUser(req.session.user.userId, password)
        .catch((err) => {
            console.log(err);
        });

    return res.json({ success: insertId > -1 });
});

/**
 * Checks if username is valid and not already in use.
 * @param {Buffer} username
 * @param {String} raw_username
 * @returns Promise determining whether the username is valid.
 */
async function checkUsername(username, raw_username) {
    const query = 'SELECT * FROM User WHERE username = ? LIMIT 1;';
    const values = [username];

    return new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (Array.isArray(results) && results.length > 0 && results[0].userId > -1) {
                    reject("Username already used");
                } else if (raw_username.length < 8 && raw_username.length > 32) {
                    reject("Invalid Username");
                }

                resolve("Success");
            }
        });
    });
};

/**
 * Checks whether a password is at least 8 characters and no more than 32 characters, and contains at least one lowercase letter, one uppercase letter,
 * one number, and one special character.
 * @param {String} password
 * @returns Promise determing whether the password is valid.
 */
async function checkPassword(password) {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?=.*[-!$%^&*()_+|~=`{}\[\]:\/;<>?,.@#]).{8,32}$/;

    return new Promise((resolve, reject) => {
        if (typeof password === 'string' && password.length && regex.test(password)) {
            resolve("Success");
        } else {
            reject("Invalid Password");
        }
    });
}

/**
 * Checks whether a email at least contains an @ symbol
 * @param {String} email
 * @returns Promise determining whether the email is valid.
 */
async function checkEmail(email) {
    return new Promise((resolve, reject) => {
        if (email.includes("@") && email.length > 1) {
            resolve("Success");
        } else {
            reject("Invalid Email");
        }
    });
}

/**
 * Adds a user the User table in the db.
 * @param {Buffer} username
 * @param {Buffer} password
 * @param {Buffer} email
 * @returns Promise
 */
async function addUser(username, password, email) {
    const query = 'INSERT INTO User VALUES(NULL, ?, ?, ?, 0);';
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
 * Updates a user in the User table.
 * @param {Buffer} username
 * @param {Buffer} password
 * @param {Buffer} email
 * @returns Promise
 */
async function updateUser(username, password, email, user) {
    const query = 'UPDATE User SET username = ?, password = ?, email = ? WHERE userId = ?;';

    let new_username = username ? username : crypt.arrayToBuffer(user.username);
    let new_password = password ? password : crypt.arrayToBuffer(user.password);
    let new_email = email ? email : crypt.arrayToBuffer(user.email);

    const values = [new_username, new_password, new_email, user.userId];

    return new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve({ affectedRows: results.affectedRows, username: new_username, password: new_password, email: new_email });
            }
        });
    });
}

/**
 * Deletes a user from the table in the db.
 * @param {int} userId
 * @param {Buffer} password
 * @returns Promise
 */
async function deleteUser(userId, password, accessLevel = 0) {
    const query = accessLevel == 0 ? "DELETE FROM User WHERE userId = ? AND password = ?" : "DELETE FROM User WHERE userId = ?";
    const values = accessLevel == 0 ? [userId, password] : [userId];

    return new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                req.err = err;
                reject(err);
            } else {
                resolve(results.affectedRows);
            }
        });
    });
}

//=========================== Admin functions ================================//

/**
 * Get a specific user's userId by searching there username.
 */
router.get('/get', async function (req, res, next) {
    if (req.session.user.accessLevel != 1) {
        return res.json({ success: false, msg: "access denied" });
    } else if (!req.query.username) {
        return res.json({ success: false, msg: "Invalid parameters" });
    }

    let username = await crypt.encrypt(req.query.username, KEY);

    let userId = await new Promise((resolve, reject) => {
        const query = "SELECT userId FROM User WHERE username = ? LIMIT 1;";
        const values = [username];

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (Array.isArray(results) && results.length) {
                    resolve(results[0].userId);
                } else {
                    resolve(-1);
                }   
            }
        });
    }).catch((err) => {
        return -1;
    });

    return res.json({ userId: userId });
});

/**
 * Allows an admin to remove a user's account.
 */
router.delete('/ban', async function (req, res, next) {
    if (req.session.user.accessLevel != 1) {
        return res.json({ success: false, msg: "access denied" });
    } else if (!req.body.userId) {
        return res.json({ success: false, msg: "Invalid parameters" });
    }

    let affectedRows = await deleteUser(req.body.userId, null, req.session.user.accessLevel)
        .catch((err) => {
            console.log(err);
        });

    return res.json({ success: affectedRows > -1 });
});


//============================== End of admin functions =================================//

/**
 * Gets user information 
 */
router.get('/', async function (req, res, next) {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }

    let username = (await crypt.decrypt(crypt.arrayToBuffer(req.session.user.username), KEY)).toString('utf-8');
    let password = (await crypt.decrypt(crypt.arrayToBuffer(req.session.user.password.data), KEY)).toString('utf-8');
    let email = (await crypt.decrypt(crypt.arrayToBuffer(req.session.user.email.data), KEY)).toString('utf-8');

    return res.json({ username: username, password: password, email: email });
});


module.exports = router;