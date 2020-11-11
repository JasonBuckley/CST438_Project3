$(document).ready(function () {
    $("#search-bar").focus();

    $("#search-res").hide();

    $("#search-btn").on("click", function() {
        let input = $("#search-bar").val();

        $("#search-res").hide();

        if (input === "") {
            alert("empty");
            return;
        }
        
        let title = input.replace(/\s+/g,'+');
        console.log("Searching for: ", title);

        searchByTitle(title).then((result) => {
            if (result.numFound > 0 && result.docs.length > 0) {
                $("#search-res").show();

                let books = result.docs;
                console.log(books);

                let count = 0;

                for (let i = 0; i < books.length; i++) {
                    if (books[i].title && books[i].isbn.length != 0) {
                        addToRow(books[i], i);
                        count++;
                        if (count == 4) {
                            break;
                        }
                    }

                }
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

// function addToRow(book) {
//     let title = book.title;
//     let isbn = book.isbn[0];
//     let img = `http://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`

//     $(".book-row").append(
//         `
//         <div class="col-md-3">
//             <div class="product-top">
//                 <img src="${img}" alt="Picture of ${book.title}">
//             </div>
//             <div class="product-bottom text-center">
//                 <h3>${title}</h3>
//                 <h5>ISBN: ${isbn}</h5>
//             </div>
        
//         </div>
//         `
//     );
// }

function addToRow(book, index) {
    let title = book.title;
    let isbn = book.isbn[0];
    let img = `http://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`

    $(`#book-img-${index+1}`).attr({"src": img, height: "300", width: "100%", isbn: isbn});
    $(`#book-title-${index+1}`).html(`${title}`);
    $(`#book-isbn-${index+1}`).html(`${isbn}`);
}


document.querySelectorAll("[id^='book-img-']")
  .forEach(function(el) {
    el.onclick = function() {
      console.log(this.id)
      let isbn = $(`#${this.id}`).attr("isbn");
      console.log(isbn);
      window.location.href = `/book/isbn/${isbn}`;
    }
  })
