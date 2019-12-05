var gplay = require('google-play-scraper');
var fs = require('fs');

opts = {
    term: 'hayfever',
    lang: 'en',
    country: 'us',
    num: 3, // max is 250
    price: 'free', // all, free, paid
    fullDetail: false  // if true an extra request is made for each app
};

gplay.search(opts)
    .then( (results, err) => {
	fs.writeFile('google_results.txt', JSON.stringify(results), (err) => {
	   if (err) throw err;
	   console.log('Android apps saved!');
       });
   }).catch();
