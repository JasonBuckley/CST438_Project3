var express = require('express');
var router = express.Router();

/* GET review page. */
router.get('/', function(req, res, next) {
  res.render('reviews', { title: 'Express' });
  
});

module.exports = router;
