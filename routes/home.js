var express = require('express');
const router = express.Router();
const https = require("https");


router.get('/', function(req, res, next) {
    res.render('home');
});

router.get('/search', async function(req, res, next) {
    let title = req.query.title.replace(/\s+/g,'+');
    const url = `https://openlibrary.org/search.json?title=${title}`;

    return res.json({ url: url});

    // let result = await request(url)
    //     .then((data) => console.log(data))
    //     .catch((err) => {
    //         console.log(err);
    //         return -1;
    //     });

    // return res.json({ success: result > -1 });
});

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
                        resolve(data);
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
