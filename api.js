var http = require("https");
const pug = require('pug');


module.exports = {
	getWeather(response, city, country) {
	var options = {
	"method": "GET",
	"hostname": "community-open-weather-map.p.rapidapi.com",
	"port": null,
	"path": "/weather?id=2172797&units=%22metric%22%20or%20%22imperial%22&mode=xml%2C%20html&q="+city+"%2C"+country,
	"headers": {
		"x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
		"x-rapidapi-key": "59329ba691msh5b358718dfe818cp1e8076jsn02a583dba5b6"
	}
};

var req = http.request(options, function (res) {
	var chunks = [];

	res.on("data", function (chunk) {
		chunks.push(chunk);
	});

	res.on("end", function () {
		var bodystr = Buffer.concat(chunks);
		var body = JSON.parse(bodystr);
		const render = pug.compileFile('about.pug');

        response.write(
        render({
        	title: body.name,
        message: body.main.temp - 273.15,
        srcString :`http://openweathermap.org/img/wn/${body.weather[0].icon}@2x.png`}
        ));
        response.end();
		console.log(bodystr.toString());
	});
});

req.end();
}
}