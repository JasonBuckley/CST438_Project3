// This document's functions are meant for use with the nav bar
// The perform the search function and replace whatever the 
// current content of a page is with the search results

$(document).ready(async function () {
    $("#input").focus();

    $("#search-form").submit(function(event) {
        event.preventDefault(); 

        let input = $("#input").val();
        let title = input.replace(/\s+/g,'+');
        console.log("Searching for: ", title);

        searchByTitle(title).then((result) => {
            console.log(result);
            if (result.amount > 0 && result.books.length > 0) {
                showBooks(result.books);
            }
        });
    });
});

function searchByTitle(title) {
    return $.ajax({
        type: "GET",
        url: "/search?title=" + title,
        dataType: "json",
        contentType: "application/json",
        success: function(result, status) {
            return result;
        }
    });
}

function showBooks(books) {
    // clear main
    main.innerHTML = "";

    const searchResults = document.createElement("div");
    searchResults.classList.add("search-results");

    books.forEach((book) => {
        const { author_name, isbn, title } = book;

        const bookElement = document.createElement("div");
        bookElement.classList.add("book");

        // Should change to request, is status is 404 don't show
        let img = `http://covers.openlibrary.org/b/isbn/${isbn[0]}-M.jpg?default=false`;
        
        bookElement.innerHTML = `
        <img
            src="${img}"
            alt="${title}"
        />
        <div class="book-info" isbn=${isbn[0]}>
            <h3><a href="/book/isbn/${isbn[0]}">${title}</a></h3>
        </div>
        `;

        searchResults.appendChild(bookElement);
    });
    
    main.appendChild(searchResults);
}