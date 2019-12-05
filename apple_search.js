var store = require('app-store-scraper');
var fs = require('fs');

opts = {
    term: 'hay fever',
    lang: 'en-us',
    country : 'us',
    num: 3,
    page: 1,
    idsOnly: false // skip extra lookup request for each app
};

store.search(opts)
    .then( (results, err) => {
	fs.writeFile('apple_results.txt', JSON.stringify(results), (err) => {
	   if (err) throw err;
	   console.log('iOS apps saved!');
       });
   }).catch();
