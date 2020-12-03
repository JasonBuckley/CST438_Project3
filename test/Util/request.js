const http = require("http");

/**
 * Makes a http request to the given endpoint specified in the options.  The possible options are hostname,
 * port, path, method, and headers. Optionally the method allows for sending data within the body of a http
 * request, and if needed the method will return the responses headers.
 * 
 * @param {JSON} options
 * @param {JSON} body
 * @param {boolean} needHeader
 */
function request(options, body, needHeader) {
    return new Promise((resolve, reject) => {
        let req = http.request(options, (res) => {
            let body = "";

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode != "200" && (body && res.statusCode != 302)) {
                    reject("Call to api end point has failed with response code " + res.statusCode);
                } else {
                    try {
                        let data = JSON.parse(body);
                        if (needHeader) {
                            resolve({ data: data, headers: res.headers['set-cookie'] });
                        } else {
                            resolve(data);
                        }
                    } catch (e) {
                        reject('Error parsing JSON!');
                    }

                }
            });

            res.on('error', (err) => {
                reject(err);
            });
        });

        if (body) {
            req.write(body);
        }

        req.end();
    });
}

module.exports.request = request;