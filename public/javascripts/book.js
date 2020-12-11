/*global $*/
$(document).ready(async function () {
    let old_isbn = $("#book").attr("isbn");

    let loggedIn = await getUserId();
    let userId = 0;
    if (loggedIn.success) {
        userId = loggedIn.userId;
        loggedIn = true;
    } else {
        loggedIn = false;
    }
    console.log(`Logged In: ${loggedIn}, User ID: ${userId}`);

    let searchResults = await searchByISBN(old_isbn);
    console.log(`Search results for book with ISBN: ${old_isbn}: `, searchResults);

    // Old ISBN may not be present in db, reference using ISBN10/13 instead
    let new_isbn = 0;
    if (searchResults.isbn_10) {
        new_isbn = searchResults.isbn_10[0];
    } else if (searchResults.isbn_13) {
        new_isbn = searchResults.isbn_13[0];
    }

    console.log(`Old ISBN: ${old_isbn}, New ISBN: ${new_isbn}`);

    let searchBook = await getBook(new_isbn);
    let bookId = 0;
    if (searchBook.length != 0) {
        bookId = searchBook[0].bookId;
    }
    console.log(`Resulting bookId after searching db for book with matching ISBN of ${new_isbn}: `, bookId);
    
    // Fill out page with matching attributes with 
    // the information gathered by the third party API
    let title = searchResults.title;
    $("#book-title").html(`${title}`);

    let publisher = searchResults.publishers[0];
    $("#book-publisher").html(`Publisher: ${publisher}`);

    let publish_year = searchResults.publish_date;
    $("#book-pub-year").html(`Published: ${publish_year}`);

    $("#book-isbn").html(`ISBN: ${old_isbn}`);

    let author_img = searchResults.authors ? `http://covers.openlibrary.org/a/olid/${searchResults.authors[0]["key"].split("/")[2]}-S.jpg` : "../../images/blank-profile.jpg";
    $("#author").attr({ "src": author_img });

    // If this book is in our db gather reviews and avg rating
    if (bookId != 0) {
     

       
        getAvgRating(bookId).then((result) => {
            console.log("Average rating: ", result.avg_rating[0].avg_rating);
            if (result != null) {
                document.getElementById("rate").value = `${result.avg_rating[0].avg_rating}`;
                $("#book-avg-rating").html(`Average Rating: ${result.avg_rating[0].avg_rating}/10`);
            }
        });
        // getReviews(bookId).then((result) => {
        //     console.log(result.reviews);
        //     result.reviews.forEach((review) => {
        //         createFrameDiv(review);
        //     });
        // });
    }

    $("#rate-form").submit(async function(event) {
        event.preventDefault(); 

        let rating = $("#rate").val();
        console.log("Rate value: ", rating);

        if (!loggedIn) {
            alert("You must be logged in to rate a book!");
            return;
        }

        // If bookId == 0, then book is not in db thus not ratings are present, add book, get bookId, add rating
        if (bookId == 0) {
            let bookAdded = await addBook(old_isbn);
            console.log("Book added? ", bookAdded);
            if (bookAdded.success) {
               bookId = bookAdded.bookId;
               let bookRated = await addRating(new_isbn, rating);
               console.log(bookRated);
               //location.reload();
                
            } else {
                alert(`Error adding book with ISBN: ${old_isbn}`);
            }
            return;
        }
        // let rating = await getUserRating(userId, bookId)
        // console.log(rating.rating[0].rating);

        // Else check if the user already rated the book, if so update it

    });
});

/**
 * Calls 3rd party API searching for a book by ISBN
 * @param isbn
 * @returns JSON Array
 */
function searchByISBN(isbn) {
    return $.ajax({
        url: `https://openlibrary.org/isbn/${isbn}.json`,
        method: "GET",
        dataType: "json",
        success: function (result, status) {
            return result;
        }
    });
}

/**
 * Calls book API searching for a book by ISBN
 * @param isbn
 * @returns JSON Array
 */
function getBook(isbn) {
    return $.ajax({
        url: `/book?isbn=${isbn}`,
        method: "GET",
        dataType: "json",
        success: function (result, status) {
            return result;
        }
    });
}

/**
 * Calls review API searching for reviews with a matching book ID
 * @param bookId
 * @returns JSON Array
 */
function getReviews(bookId) {
    return $.ajax({
        url: `/review/get-review?bookId=${bookId}`,
        method: "GET",
        dataType: "json",
        success: function (result, status) {
            return result;
        }
    });
}

/**
 * Calls review API that calulates the average rating of book
 * @param bookId
 * @returns JSON Array
 */
function getAvgRating(bookId) {
    return $.ajax({
        url: `/review/get-rating?bookId=${bookId}`,
        method: "GET",
        dataType: "json",
        success: function (result, status) {
            return result;
        }
    });
}

function getUserId() {
    return $.ajax({
        url: `/user/getUserId`,
        method: "GET",
        dataType: "json",
        success: function (result, status) {
            return result;
        }
    });
}

function getUserRating(userId, bookId) {
    return $.ajax({
        url: `/review/get-rating?userId=${userId}&bookId=${bookId}`,
        method: "GET",
        dataType: "json",
        success: function (result, status) {
            return result;
        }
    });
}

function addBook(isbn) {
    return $.ajax({
        url: `/book/add`,
        method: "POST",
        dataType: "json",
        data: {"isbn": isbn},
        success: function (result, status) {
            return result;
        }
    });
}

function addRating(isbn, rating) {
    return $.ajax({
        url: `/review/add-rating`,
        method: "POST",
        dataType: "json",
        data: {"isbn": isbn, "rating": rating},
        success: function (result, status) {
            return result;
        }
    });
}

/**
 * Populates review box
 */



