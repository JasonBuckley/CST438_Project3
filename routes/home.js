const express = require('express');
const router = express.Router();

const search = require("../routes/Util/search");


router.get('/', function(req, res, next) {
    res.render('home');
});

/**
 * Searches for a book using a third party api given a title
 */
router.get('/search', async function(req, res, next) {
    let title = req.query.title;

    let result = await search.searchByTitle(title);

    books = [];

    if (result.numFound == 0 || result.docs.length == 0) {
        return res.json({ books: books, amount: books.length });
    }

    result.docs.forEach((book) => {
        if (validate(book)) {
            books.push(book);
        }
    });

    return res.json({ books: books, amount: books.length });
});

/**
 * Checks book json object for all attributes
 * @param book
 * @returns boolean
 */
function validate(book) {
    if (!book.author_name || book.author_name.length == 0) {
        return false;
    } else if (!book.title) {
        return false;
    } else if (!book.isbn || book.isbn.length == 0) {
        return false;
    } else if (!book.publisher || book.publisher.length == 0) {
        return false;
    } else {
        return true;
    }
}

module.exports = router;
