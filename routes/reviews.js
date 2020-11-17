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
    
    const q ='SELECT * from reviews';

    pool.query(q, function (err, res) {
    if (err) throw err;
    console.log("Result: " + res);
  });
  
    res.render('reviews');
});

router.post("/add", function(req, res){
    //const q ='INSERT INTO reviews VALUES (';
    //const endq = ')';
    req.body.reviewSubmit;
    console.log(req.body);

});


module.exports = router;

