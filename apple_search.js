var store = require('app-store-scraper');
var fs = require('fs');

opts = {
    term: process.argv[2],	// Search expression
    lang: 'en-us', 		// App language
    country : process.argv[3],  // iOS App Store country 2 letter code
    num: process.argv[4],	// Number of search results, default 50
    page: 1,
    idsOnly: true 		// skip extra request for each app
};

store.search(opts)
    .then( (results, err) => {
	fs.writeFile('apple_results.txt', JSON.stringify(results), (err) => {
	   if (err) throw err;
	   console.log('iOS apps saved!');
       });
   }).catch();
