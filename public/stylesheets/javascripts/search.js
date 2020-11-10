$(document).ready(function () {
    $("#search-btn").on("click", function() {
        let input = $("#search-input").val();
        let title = input.replace(/\s+/g,'+');
        console.log("Searching for: ", title);

        searchByTitle(title).then((result) => {
            if (result.numFound > 0 && result.docs.length > 0) {
                result.docs.forEach((book) => {
                    createFrameDiv(book);
                });
            }
        });

    });
});

function searchByTitle(title) {
    return $.ajax({
        url: "https://openlibrary.org/search.json?title=" + title,
        method: "GET",
        dataType: "json",
        success: function (result, status) {
            return result;
        }
    }); 
}

//http://covers.openlibrary.org/b/id/9646548-S.jpg
//http://covers.openlibrary.org/b/isbn/0385472579-S.jpg



// creates a frame that holds the info for a product.
function createFrameDiv(book) {
    let isbn = book.isbn.length > 1 ? book.isbn[0] : book.isbn;
    let img = `http://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`
    $("#bookContainer").append(
        `
        <tr>
            <td>
                <div class="row">
                    <div class="col-md-5 text-left">
                        <img src="${img}" alt="Picture of ${book.title}" class="img-fluid rounded mb-2 shadow">
                    </div>
                    <div class="col-md-7 text-left mt-sm-2">
                        <h4><strong><a href="/book/isbn/${isbn}">${book.title}</a></strong></h4>
                        <p class="font-weight-light">${book.author_name}</p>
                    </div>
                </div>
            </td>
            <td><p style="overflow:hidden; max-height: 4.9em">First published in ${book.first_publish_year}</p></td>
            <td>
                <span>${isbn}</span> ISBN
            </td>
            <td class="actions" data-th="">
                Publisher(s)<span>${book.publisher}</span>
            </td>
        </tr>

        `
    );
}
