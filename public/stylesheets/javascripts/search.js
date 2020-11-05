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
