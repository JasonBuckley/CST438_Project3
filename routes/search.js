var express = require('express');
const router = express.Router();


router.get('/', function(req, res, next) {
    res.render('search', { search_results: 'Express' });
});

module.exports = router;
