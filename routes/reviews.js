var express = require('express');
const router = express.Router();


router.get('/', function(req, res, next) {
    res.render('reviews');
});

module.exports = router;
