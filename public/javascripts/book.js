$(document).ready(function () {
    let isbn = $("#book").attr("isbn");

    // Fill out page with matching attributes with 
    // the information gathered by the third party API
    searchByISBN(isbn).then((result) => {
        console.log(result);

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

    // Check if this book is in our db, if so gather reviews and avg rating
    getBook(isbn).then((result) => {
        console.log("Results from db: ", result);

        if (result.length == 0) {
            // there are no reviews or ratings in db for this book
        }

        const { bookId } = result[0];
        console.log(bookId);
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
    });

    $("#rate-form").submit(function(event) {
        event.preventDefault(); 

        let input = $("#rate").val();
        console.log("Rate value: ", input);

        getUserRating().then((result) => {
            console.log(result);
        });

        // searchByTitle(title).then((result) => {
        //     console.log(result);
        //     if (result.amount > 0 && result.books.length > 0) {
        //         showBooks(result.books);
        //     }
        // });
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

function getUserRating(bookId) {
    return $.ajax({
        url: `/review/get-rating?bookId=${bookId}&getUserRating=${true}`,
        method: "GET",
        dataType: "json",
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

