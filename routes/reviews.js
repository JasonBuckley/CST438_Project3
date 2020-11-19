var express = require('express');
const router = express.Router();
const mysql = require('mysql');

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
router.get('/', function(req, res, next) {
    
    const q  ='SELECT * from reviews';
    //const q2 ='SELECT * from book';

    pool.query(q, function (err, res) {
    if (err) throw err;
    console.log("Result: " + res);
  });
  
    res.render('reviews');
    //res.render('reviews' , res.comments);
});

// router.post("/add", function(req, res){
//     //const q ='INSERT INTO reviews VALUES (';
//     //const endq = ')';
//     req.body.reviewSubmit;
//     console.log(req.body);

// });
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

