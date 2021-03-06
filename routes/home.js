const express = require('express');
const router = express.Router();

const search = require("../routes/Util/search");

router.get('/admin', function (req, res, next) {
    if (!req.session.user || req.session.user.accessLevel != 1) {
        res.redirect('/user/login');
    }

    res.render('adminPage', { username: req.session.username });
});

router.get('/', function(req, res, next) {
    console.log(req.session.username);
    if (req.session.user) {
        res.render("home", { username:  req.session.username});
    
    } else {
        res.render("home");
    }
});

/**
 * Searches for a book using a third party api given a title or isbn
 */
router.get('/search', async function(req, res, next) {
    let title = req.query.title;
    let isbn = req.query.isbn;

    if (isbn && !title) {
        let result = await search.searchByISBN(isbn);
        return res.json({ successful: true, book: result });
    }

    if (!isbn && title) {
        let result = await search.searchByTitle(title);

        books = [];

        if (result.numFound == 0 || result.docs.length == 0) {
            return res.json({ successful: true, books: books, amount: books.length });
        }

        result.docs.forEach((book) => {
            if (validate(book)) {
                books.push(book);
            }
        });

        return res.json({ successful: true, books: books, amount: books.length });
    }

    return res.json({ successful: false });
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