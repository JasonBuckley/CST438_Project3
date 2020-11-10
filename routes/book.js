var express = require('express');
const router = express.Router();

const session = require("express-session");


router.get('/isbn/:isbn', function(req, res, next) {
    const isbn = [req.params.isbn];
    // var obj = JSON.parse(sessionStorage.user);
    // res.render('book', {book: obj});

    // let book = searchByISBN(isbn).then((result) => {
    //     console.log(result);
    // });
    res.render('book', {isbn: isbn});
});

module.exports = router;


// http://covers.openlibrary.org/b/id/240727-S.jpg

// function searchByISBN(isbn) {
//     return $.ajax({
//         url: `https://openlibrary.org/isbn/${isbn}.json`,
//         method: "GET",
//         dataType: "json",
//         success: function (result, status) {
//             return result;
//         }
//     }); 
// }
