const express = require('express');
const router = express.Router();

const mysql = require("mysql");

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
 * Adds a review given a userId and bookId
 */
router.post('/add', async function(req, res) {
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.isbn && !req.query.review && !req.query.rating) {
        return res.json({ success: false });
    }

    let query = 'SELECT bookId FROM Book WHERE ISBN = ? LIMIT 1;';
    let values = [req.query.isbn];

    let bookId = await dbQuery(query, values);

    if (!bookId[0]) {
        return res.json({ success: false });
    }

    let data = {
        userId: req.session.user.userId,
        bookId: bookId[0].bookId,
        review: req.query.review,
        rating: req.query.rating
    };

    query = 'INSERT INTO Review VALUES(NULL, ?, ?, ?, ?);';
    values = [data.userId, data.bookId, data.review, data.rating];

    let result = await dbQuery(query, values).catch((err) => {
        console.log(err);
        return -1;
    });

    if (result == -1) {
        return res.json({success: false});
    }

    return res.json({ success: result.insertId > -1 });
});

/**
 * Retrieves reviews for a book given a reviewId, bookId, or a userId
 */
router.get('/get', async function(req, res) {
    let query = "SELECT * FROM Review WHERE ";

    if (req.query.reviewId) {
        query += "reviewId = ?";
        let reviews = await dbQuery(query, req.query.reviewId);
        return res.json({reviews: reviews});
    } else if (req.query.bookId) {
        query += "bookId = ?";
        let reviews = await dbQuery(query, req.query.bookId);
        return res.json({reviews: reviews});
    } else if (req.query.userId) {
        query += "userId = ?";
        let reviews = await dbQuery(query, req.query.userId);
        return res.json({reviews: reviews});
    } else {
        return res.json({success: false, msg: "Invalid parameters"});
    }
});

/**
 * Updates a review given a valid reviewId and a review and/or rating
 */
router.put('/update', async function(req, res) {
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.reviewId && !req.query.review && !req.query.rating) {
        return res.json({ success: false });
    }

    let reviewId = req.query.reviewId;
    let query = "SELECT * FROM Review WHERE reviewId = ? LIMIT 1;";
    let review = await dbQuery(query, reviewId);

    if (!review[0]) {
        return res.json({ success: false });
    }

    let reviewText = req.query.review;
    let ratingValue = req.query.rating;

    query = 'UPDATE Review SET review = ?, rating = ? WHERE reviewId = ?;';
    const values = [reviewText, ratingValue, review[0].reviewId];

    let result = await dbQuery(query, values);

    return res.json({ success: result.affectedRows > 0 });
});

router.delete('/delete', async function(req, res) {
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.reviewId || !req.query.bookId || !req.query.review || !req.query.rating) {
        return res.json({ success: false });
    }
    
    const query = "DELETE FROM Review WHERE reviewId = ? AND userId = ? AND bookId = ? AND review = ? AND rating = ?";
    const values = [req.query.reviewId, req.session.user.userId, req.query.bookId, req.query.review, req.query.rating];
    let result = await dbQuery(query, values);

    return res.json({success: result.affectedRows >= 1});
});


/**
 * Conducts a query in the DB, handling all CRUD operations
 * @param query
 * @param values
 * @returns Promise that pulls or edits info from the db
 */
async function dbQuery(query, values) {
    return new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = router;