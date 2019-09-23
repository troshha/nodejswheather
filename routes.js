const url = require('url');
let fs = require('fs');
var http = require("https");
var request = require("request");
var api = require("./api");
var querystring = require('querystring');

html = {
    render(path, response) {
        fs.readFile(path, null, function (error, data) {
            if (error) {
                response.writeHead(404);
                respone.write('file not found');
            } else {
                response.write(data);
            }
            response.end();
        });
    }
}

module.exports = {
    handleRequest(request, response) {
        response.writeHead(200, {
            'Content-Type': 'text/html'
        });

        let path = url.parse(request.url).pathname;

        switch (path) {
            case '/':
                html.render('./index.html', response);
                break;
            case '/about':

             if(request.method === 'POST') {
            let body = '';
                request.on('error', (err) => {
            if(err) {
                response.writeHead(500, {'Content-Type': 'text/html'});
                response.write('An error occurred');
                response.end();
            }
        });

        // read chunks of POST data
        request.on('data', chunk => {
            body += chunk.toString();
        });

        // when complete POST data is received
        request.on('end', () => {
            // use parse() method
            body = querystring.parse(body);

            // { name: 'John', gender: 'MALE', email: 'john@gmail.com' }
            //console.log(body);
            api.getWeather(response, body.city, body.country);

            // rest of the code
        });
             }
                 //html.render('./about.html', response);
                break;
            default:
                response.writeHead(404);
                response.write('Route not found');
                response.end();
        }
    }
}