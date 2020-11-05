$(document).ready(function () {
    $("#search-btn").on("click", function() {
        let input = $("#search-input").val();
        let title = input.replace(/\s+/g,'+');
        console.log("Searching for: ", title);

        searchByTitle(title).then((result) => {
            console.log(result);
            if (result.numFound > 0 && result.docs.length > 0) {
                console.log(result.docs);
                // Display search results
                result.products.forEach((product) => {
                    createFrameDiv(product);
                });
            }
        });

    });

});

// getProducts(page).then((result) => {
//     if (result.success && result.products.length > 0) {
//          // Allow room for product list, rid of product carousel
//          $(".slider").hide();
//          $(".search-res").show();

//          // Remove results from previous searches
//          $("#productContainer").empty();

//         // Display search results
//         result.products.forEach((product) => {
//             createFrameDiv(product);
//         });
//     } else {
//         // Maintain original page format, reset for no results
//         $(".slider").show();
//         $(".search-res").hide();
//     }
// });

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

// creates a frame that holds the info for a product.
function createFrameDiv(book) {
    img = product.imgId ? "https://drive.google.com/uc?export=download&id=" + product.imgId : "/images/Empty.png";
    $("#productContainer").append(
        `
        <tr>
            <td>
                <div class="row">
                    <div class="col-md-5 text-left">
                        <img src="${img}" alt="Picture of ${product.name}" class="img-fluid rounded mb-2 shadow ">
                    </div>
                    <div class="col-md-7 text-left mt-sm-2">
                        <h4><strong><a href="/product/${product.productId}">${product.name}</a></strong></h4>
                        <p class="font-weight-light">${product.brand}</p>
                    </div>
                </div>
            </td>
            <td><p style="overflow:hidden; max-height: 4.9em">${product.info}</p></td>
            <td>
                <span>${product.stock}</span> Available
            </td>
            <td class="actions" data-th="">
                $<span>${product.cost}</span>
            </td>
        </tr>

        `
    );
}