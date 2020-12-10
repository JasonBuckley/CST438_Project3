$(document).ready(async function () {
    // Setting global variables: isbn, bookId, userId
    let isbn = $("#book").attr("isbn");

    let bookId = await getBook(isbn);
    if (bookId.length == 0) {
        // book is not in db add it
        bookId = 0;
    } else {
        bookId = bookId[0].bookId;
    }

    let loggedIn = await getUserId();
    let userId = 0;
    if (loggedIn.success) {
        userId = loggedIn.userId;
        loggedIn = true;
    } else {
        loggedIn = false;
    }

    console.log("Book ID: ", bookId);
    console.log("User ID: ", userId);

    
    let new_isbn = 0;
    // Fill out page with matching attributes with 
    // the information gathered by the third party API
    searchByISBN(isbn).then((result) => {
        console.log(result);

        if (result.isbn_10) {
            new_isbn = result.isbn_10[0];
        } else if (result.isbn_13) {
            new_isbn = result.isbn_13[0];
        }

        console.log("Confirming isbn: ", new_isbn);

        getBook(new_isbn).then((result) => {
            if (result.length == 0) {
                // book is not in db
                bookId = 0;
            } else {
                bookId = result[0].bookId;
                console.log("New bookId: ", bookId);
            }
        });

        let title = result.title;
        $("#book-title").html(`${title}`);

        let publisher = result.publishers[0];
        $("#book-publisher").html(`Publisher: ${publisher}`);

        let publish_year = result.publish_date;
        $("#book-pub-year").html(`Published: ${publish_year}`);

        $("#book-isbn").html(`ISBN: ${isbn}`);

        let author_img = result.authors ? `http://covers.openlibrary.org/a/olid/${result.authors[0]["key"].split("/")[2]}-S.jpg` : "../../images/blank-profile.jpg";
        $("#author").attr({ "src": author_img });
    });

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
            let bookAdded = await addBook(isbn);
            console.log("Book added? ", bookAdded);
            if (bookAdded.success) {
               bookId = bookAdded.bookId;
               let bookRated = await addRating(new_isbn, rating);
               console.log(bookRated);
               //location.reload();
                
            } else {
                alert(`Error adding book with ISBN: ${isbn}`)
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
function createFrameDiv(review) {
    $("#reviewBox").append(
        `
        <tr>
            <td>
                <p>${review.userId}</p>
            </td>
            <td>
                <p>${review.reviewId}</p>
            </td>
            <td>
                <p>${review.review}</p>
            </td>
        </tr>
        `
    );
}

