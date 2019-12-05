var gplay = require('google-play-scraper');
var fs = require('fs');

opts = {
    term: 'hayfever',
    lang: 'en',
    country: 'us',
    price: 'x free',
    num: 3
};

gplay.search(opts)
    .then( (results, err) => {
	fs.writeFile('google_results.txt', JSON.stringify(results), (err) => {
	   // throws an error, you could also catch it here
	   if (err) throw err;
	   // success case, the file was saved
	   console.log('List of apps saved!');
       });
   }).catch();
