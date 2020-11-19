var express = require('express');
var router = express.Router();
const mysql = require("mysql");
const https = require("https");
let GENRES;

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

router.get('/isbn/:isbn', function (req, res, next) {
    const isbn = [req.params.isbn];
    res.render('book', { isbn: isbn });
});

/**
 * Renders a page with specific information for a book.
 */
router.get("/page", async function (req, res, next) {
    if ((!req.query.bookId || req.query.isbn) && (req.query.bookId || !req.query.isbn)) {
        return res.redirect('/');
    }

    // Get book's info
    let result = await new Promise((resolve, reject) => {
        const query = 'SELECT * FROM Book WHERE bookId = ? OR ISBN13 = ? OR ISBN10 = ? LIMIT 1';
        const values = [req.query.bookId ? req.query.bookId : "", req.query.isbn ? req.query.isbn : "", req.query.isbn ? req.query.isbn : ""];

        pool.query(query, values, (err, results) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                if (Array.isArray(results) && results.length) {
                    resolve(results[0]);
                }

                reject("bookId not found");
            }
        });
    }).catch((err) => {
        console.log(err);
        return -1;
    });

    if (result === -1) {
        return res.redirect('/');
    }
  
    // Gets book's genres
    let genres = await new Promise((resolve, reject) => {
        const query = 'SELECT genre FROM Book_Genres NATURAL JOIN Genre WHERE bookId = ?';
        const values = req.query.bookId ? req.query.bookId : result.bookId;

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });

    if (!Array.isArray(genres) && !genres.length && genres.length < 1) {
        genres = [];
    }

    // returns info in JSON.
    if (req.query.format == 'JSON') {
        return res.json({ book: result, genres: genres });
    }

    return res.render('reviews', { book: result });
});

/**
 * Gets 25 or fewer books from the database.
 */
router.get("/", async function (req, res, next) {
    if (req.query.search) {
        next();
        return;
    }

    let result = await new Promise((resolve, reject) => {
        const query = 'SELECT * FROM Book LIMIT 25';

        pool.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });

    return res.json(result);
});

/**
 * Gets all books that contain the search key.
 */
router.get("/", async function (req, res, next) {
    let result = await new Promise((resolve, reject) => {
        const query = `SELECT * FROM Book WHERE name LIKE ${pool.escape('%' + req.query.search + '%')} LIMIT 25;`;
        const values = [req.query.search];

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });

    return res.json(result);
});

/**
 * Adds a book, and its genres given a valid isbn number.
 */
router.post("/add", async function (req, res, next) {
    if (!req.body.isbn) {
        res.json({ success: false });
    }

    const url = new URL("https://openlibrary.org/api/books?bibkeys=ISBN:" + req.body.isbn + "&jscmd=data&format=json");

    let isValid = await checkISBN(req.body.isbn)
        .catch((err) => {
            console.log(err);
            return false;
        });

    let result;
    if (isValid) {
        result = await request(url)
            .then((data) => addBook(data))
            .catch((err) => {
                console.log(err);
                return -1;
            });
    } else {
        result = -1;
    }

    res.json({ success: result.insertId > -1 });

    if (result.insertId > -1) {
        await getGenresFromSubjects(result.subjects)
            .then((genres) => addGenresToBook(genres, result.insertId))
            .catch((err) => {
                console.log(err);
            });
    }

    delete url;
    return;
});

/**
 * This route updates a book's information.
 */
router.put("/update", async function (req, res, next) {
    if (!req.body || !req.body.bookId) {
        return res.json({ success: false });
    }

    let result = await updateBook(req.body)
        .catch((err) => {
            console.log(err);
            return -1;
        });

    return res.json({ success: result > 0 });
});

/**
 * Adds a genre to the db.
 */
router.post("/genre/add", async function (req, res, next) {
    if (!req.body.genre) {
        return res.json({ success: false });
    }

    const query = "INSERT INTO Genre VALUES(NULL, ?);";
    const values = [req.body.genre];

    let insertId = await new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    }).catch((err) => {
        return -1;
    });

    res.json({ success: insertId > -1 });
});

/**
 * Removes a genre from the db.
 */
router.post("/genre/remove", async function (req, res, next) {
    if (!req.body.id) {
        return res.json({ success: false });
    }

    const query = "DELETE FROM Genre WHERE genreId = ?;";
    const values = [req.body.id];

    let affectedRows = await new Promise((resolve, reject) => {
        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.affectedRows);
            }
        });
    }).catch((err) => {
        return -1;
    });

    res.json({ success: affectedRows > 0 });
});

/**
 * Adds a book to the Book table in the db.
 * @param {JSON} data
 */
function addBook(data) {
    return new Promise((resolve, reject) => {
        if (!data) {
            reject("Book not found");
        }

        let author = data.authors ? data.authors[0].name : "Unknown";
        let title = data.title;
        let coverImg = data.cover ? data.cover.medium : "None";
        let isbn13 = data.identifiers.isbn_13 ? data.identifiers.isbn_13[0] : "";
        let isbn10 = data.identifiers.isbn_10 ? data.identifiers.isbn_10[0] : "";
        let publisher = data.publishers[0] ? data.publishers[0].name : "Unknown";
        let subjects = data.subjects;

        const query = 'INSERT INTO Book VALUES(null, ?, ?, ?, ?, ?, ?);';
        const values = [title, author, coverImg, isbn13, isbn10, publisher];

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve({ insertId: results.insertId, subjects: subjects });
            }
        });
    });
}

/**
 * Given a json it will attempt to update a books information in the db.
 * @param {json} data
 * return Promise containing rows affected.
 */
function updateBook(data) {
    return new Promise((resolve, reject) => {
        if (!data) {
            reject("Need data to update book!");
        }

        let author = data.author;
        let title = data.title;
        let coverImg = data.coverImg;
        let publisher = data.publisher;
        let bookId = data.bookId;

        const query = 'UPDATE Book SET '
            + 'name = IFNULL(?, name), '
            + 'author = IFNULL(?, author), '
            + 'coverImg = IFNULL(?, coverImg), '
            + 'publisher = IFNULL(?, publisher) '
            + 'WHERE bookId = ?;'
        const values = [title, author, coverImg, publisher, bookId];

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.affectedRows);
            }
        });
    });
}

/**
 * This method takes in an array of subjects and scans for key words that indicate genres for a given book.
 * @param {Array} subjects
 * @returns Promise containing genre ids
 */
async function getGenresFromSubjects(subjects) {
    if (!GENRES) {
        GENRES = await getAllGenres();
    }

    return new Promise((resolve, reject) => {
        let bookGenres = [];

        if (subjects) {
            // searches through a max of 25 subjects.
            for (var i = 0; i < subjects.length && i < 25; i++) {
                for (var j = 0; j < GENRES.length; j++) {
                    if (subjects[i].name.toLowerCase().includes(GENRES[j].genre.toLocaleLowerCase()) && bookGenres.indexOf(GENRES[j].genreId) < 0) {
                        bookGenres.push(GENRES[j].genreId);
                    }
                }
            }
        }

        resolve(bookGenres);
    });
}

/**
 * Gets all genres from the db.
 */
function getAllGenres() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM Genre LIMIT 100';

        pool.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

/**
 * Adds genres to the corresponding book.
 * @param {array} genres 
 * @param {int} bookId
 */
function addGenresToBook(genres, bookId) {
    return new Promise((resolve, reject) => {
        const tokens = new Array(genres.length).fill(`(?,${bookId})`).join(',');
        const query = 'INSERT INTO Book_Genres (genreId, bookId) VALUES ' + tokens + ';';
        const values = genres;

        pool.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

/**
 * checks if a isbn is valid and not already in the db.
 * @param {string} isbn
 */
function checkISBN(isbn) {
    return new Promise((resolve, reject) => {
        if (isbn && (isbn.length < 10 || isbn.length > 13)) {
            reject("Invalid ISBN");
        } else {
            const query = 'SELECT * FROM Book WHERE ISBN10 = ? OR ISBN13 = ? LIMIT 1;'
            const values = [isbn, isbn];

            pool.query(query, values, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    if (Array.isArray(results) && results.length > 0 && results[0].bookId > -1) {
                        reject("Book is already in Database!");
                    } else {
                        resolve(true);
                    }
                }
            });
        }
    });
}

/**
 * Given a url it will attempt to make a get request to the corresponding server.
 * @param {URL} url
 * @returns Promise containing json of data returned from the corresponding server.
 */
function request(url) {
    return new Promise((resolve, reject) => {
        let req = https.request(url, (res) => {
            let body = "";

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode != "200") {
                    reject("Call to api end point has failed with response code " + res.statusCode);
                } else {
                    try {
                        let data = JSON.parse(body);
                        resolve(data[Object.keys(data)[0]]);
                    } catch (e) {
                        reject('Error parsing JSON!');
                    }
                }
            });

            res.on('error', (err) => {
                reject(err);
            });
        });

        req.end();
    });
}

module.exports = router;
