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
 * Adds a review given a userId, bookId, and review text
 */
router.post('/add-review', async function(req, res) {
    // Ensure a user is logged in and the proper parameters are presen
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.isbn && !req.query.review) {
        return res.json({ success: false, msg : "Incomplete query, missing an isbn or review text." });
    }

    // Find a book in the db with a matching isbn value, extract only its bookId value if found
    let query = 'SELECT bookId FROM Book WHERE ISBN10 = ? OR ISBN13 = ? LIMIT 1;';
    let values = [req.query.isbn, req.query.isbn];

    let bookId = await dbQuery(query, values);

    if (!bookId[0]) {
        return res.json({ success: false, msg: "Invalid isbn, no matching book information found." });
    }

    // Insert values into the db and return the result
    let data = {
        userId: req.session.user.userId,
        bookId: bookId[0].bookId,
        review: req.query.review
    };

    query = 'INSERT INTO Review VALUES(NULL, ?, ?, ?, CURDATE(), ?);';
    values = [data.userId, data.bookId, data.review, 3];

    let result = await dbQuery(query, values).catch((err) => {
        console.log(err);
        return -1;
    });

    if (result == -1) {
        return res.json({success: false, msg: "Database insertion error."});
    }

    return res.json({ success: result.insertId > -1 });
});

/**
 * Adds a rating given a userId and bookId and rating value
 */
router.post('/add-rating', async function(req, res) {
    // Ensure a user is logged in and the proper parameters are present
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.isbn || !req.query.rating) {
        return res.json({ success: false, msg : "Incomplete query, missing an isbn or rating value." });
    }

    // Find a book in the db with a matching isbn value, extract only its bookId value if found
    let query = 'SELECT bookId FROM Book WHERE ISBN10 = ? OR ISBN13 = ? LIMIT 1;';
    let values = [req.query.isbn, req.query.isbn];

    let book = await dbQuery(query, values);

    if (!book[0]) {
        return res.json({ success: false, msg: "Invalid isbn, no matching book information found." });
    }

    // Ensure a user has not previously rated this book, only one rating per user is allowed
    query = 'SELECT * FROM Rating WHERE userId = ? AND bookId = ?;';
    values = [req.session.user.userId, book[0].bookId];

    let rating = await dbQuery(query, values);
    if (rating[0]) {
        return res.json({ success: false, msg: "The given user has already rated this book", previous_rating: rating[0].rating });
    }

    // Enforce rating constraints, only an int value of 0-10 inclusive is permitted
    if (req.query.rating < 0 || req.query.rating > 10) {
        return res.json({ success: false, msg: "Invalid value for a rating, select an integer between 0 and 10 inclusive." });
    }

    // Insert values into the db and return the result
    let data = {
        userId: req.session.user.userId,
        bookId: book[0].bookId,
        rating: req.query.rating
    };

    query = 'INSERT INTO Rating VALUES(?, ?, ?);';
    values = [data.userId, data.bookId, data.rating];

    let result = await dbQuery(query, values).catch((err) => {
        console.log(err);
        return -1;
    });

    if (result == -1) {
        return res.json({success: false, msg: "Database insertion error."});
    }

    return res.json({ success: result.insertId > -1 });
});

/**
 * Retrieves reviews for a book given a reviewId, bookId, or a userId
 */
router.get('/get-review', async function(req, res) {
    let query = "SELECT * FROM Review WHERE ";

    if (req.query.reviewId) {
        query += "reviewId = ?";
        let reviews = await dbQuery(query, req.query.reviewId);
        return res.json({reviews: reviews});
    } else if (req.query.bookId) {
        query += "bookId = ? ORDER BY uploadDate DESC;";
        let reviews = await dbQuery(query, req.query.bookId);
        return res.json({reviews: reviews});
    } else if (req.query.userId) {
        query += "userId = ? ORDER BY uploadDate DESC;";
        let reviews = await dbQuery(query, req.query.userId);
        return res.json({reviews: reviews});
    } else {
        return res.json({success: false, msg: "Invalid parameters"});
    }
});

/**
 * Retrieves reviews for a book given a reviewId, bookId, or a userId
 */
router.get('/get-rating', async function(req, res) {
    if (req.query.userId && req.query.bookId) {
        // Get single rating for a book for a specific user
        let query = "SELECT rating FROM Rating WHERE userId = ? AND bookId = ? LIMIT 1;";
        let values = [req.query.userId, req.query.bookId]
        let rating = await dbQuery(query, values);
        return res.json({ rating: rating[0].rating });
        
    } else if (req.query.userId) {
        // Get all ratings made by a given user
        let query = "SELECT bookId, rating FROM Rating WHERE userId = ?;";
        let values = [req.query.userId];
        let ratings = await dbQuery(query, values);
        return res.json({ ratings: ratings });

    } else if (req.query.bookId) {
        // Get average rating for a book
        let query = "SELECT AVG(rating) AS avg_rating FROM Rating WHERE bookId = ?;";
        let values = [req.query.bookId];
        let rating = await dbQuery(query, values);
        return res.json({ avg_rating: rating });

    } else {
        return res.json({ success: false, msg : "Invalid query, unable to retrieve rating information." });
    }
});

/**
 * Updates a review given a valid reviewId and review text
 */
router.put('/update-review', async function(req, res) {
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.reviewId && !req.query.review) {
        return res.json({ success: false });
    }

    let reviewId = req.query.reviewId;
    let query = "SELECT * FROM Review WHERE reviewId = ? LIMIT 1;";
    let review = await dbQuery(query, reviewId);

    if (!review[0]) {
        return res.json({ success: false });
    }

    let reviewText = req.query.review;

    query = 'UPDATE Review SET review = ? WHERE reviewId = ?;';
    const values = [reviewText, review[0].reviewId];

    let result = await dbQuery(query, values);

    return res.json({ success: result.affectedRows > 0 });
});

/**
 * Updates a rating given a valid userId, bookId and rating value
 */
router.put('/update-rating', async function(req, res) {
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.bookId && !req.query.oldRating && !req.query.newRating) {
        return res.json({ success: false });
    }

    let query = "SELECT * FROM Rating WHERE userId = ? AND bookId = ? AND rating = ? LIMIT 1;";
    let values = [req.session.user.userId, req.query.bookId, req.query.oldRating];
    let review = await dbQuery(query, reviewId);

    if (!review[0]) {
        return res.json({ success: false });
    }

    query = 'UPDATE Rating SET rating = ? WHERE userId = ? AND bookId = ?;';
    values = [req.query.newRating, req.session.user.userId, req.query.bookId];

    let result = await dbQuery(query, values);

    return res.json({ success: result.affectedRows > 0 });
});


/**
 * Deletes a review given a valid review attributes and the correct access level
 */
router.delete('/delete-review', async function(req, res) {
    // Ensure a user is logged in and all required parameters are present
    if (!req.session.user) {
        return res.redirect("/user/login");
    } else if (!req.query.reviewId || !req.query.userId || !req.query.bookId || !req.query.review) {
        return res.json({ success: false });
    }

    // To be able to delete a review a user must have an accessLevel of 1 
    // or the userId of the review to be deleted must match their own
    if (req.session.user.accessLevel == 1 || req.session.user.userId == req.query.userId) {
        const query = "DELETE FROM Review WHERE reviewId = ? AND userId = ? AND bookId = ? AND review = ?;";
        const values = [req.query.reviewId, req.query.userId, req.query.bookId, req.query.review];
        let result = await dbQuery(query, values);
        return res.json({success: result.affectedRows >= 1});
    } else {
        return res.json({ success: false });
    }
});

/**
 * Gets top five rated book information
 */
router.get('/top-five-rated', async function(req, res) {
    let query = "SELECT bookId, name, coverImg, ISBN10, ISBN13, AVG(rating) AS avg_rating FROM Book NATURAL JOIN  Rating GROUP BY name ORDER BY avg_rating DESC LIMIT 5;";
    let result = await dbQuery(query, []);
    return res.json({ res: result });
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