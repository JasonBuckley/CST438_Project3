var express = require('express');
const router = express.Router();


router.get('/', function(req, res, next) {
    res.render('home', { search_results: 'Express' });
});

module.exports = router;
