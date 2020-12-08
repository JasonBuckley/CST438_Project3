$(document).ready(function () {
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
    

    getTopFive().then((result) => {
        console.log("Top 5: ", result);
        showTopFive(result.res);
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

        main.appendChild(bookElement);
    });
}

function getTopFive() {
    return $.ajax({
        type: "GET",
        url: "/review/top-five-rated",
        dataType: "json",
        contentType: "application/json",
        success: function(result, status) {
            return result;
        }
    });
}

function showTopFive(books) {
    // clear main
    main.innerHTML = "";

    const headerElement = document.createElement("h2");
    headerElement.classList.add("header");
    headerElement.innerHTML = `Top 5 Rated Books, Chosen by Users Like You!`;
    main.appendChild(headerElement);

    books.forEach((book) => {
        const { bookId, name, ISBN10, ISBN13, avg_rating, coverImg } = book;
        console.log(bookId, name, ISBN10, ISBN13, avg_rating, coverImg);

        let isbn = ISBN10 == null ? (ISBN13 == null ? "": ISBN13) : ISBN10;
        console.log(!isbn);

        const bookElement = document.createElement("div");
        bookElement.classList.add("book");

        bookElement.innerHTML = `
        <img
            src="${coverImg}"
            alt="${name}"
        />
        <div class="book-info" isbn=${isbn}>
            <h3><a href="/book/isbn/${isbn}">${name}</a></h3>
            <span>${Math.trunc(avg_rating)}/10</span>
        </div>
        `;

        main.appendChild(bookElement);
    });
}