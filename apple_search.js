var store = require('app-store-scraper');
var fs = require('fs');

opts = {
    term: process.argv[2],	// Search expression
    lang: 'en-us', 		// App language
    country : process.argv[3],  // iOS App Store country 2 letter code
    num: process.argv[4],	// Number of search results, default 50
    page: process.argv[5],	// Results page to retrieve
    idsOnly: true 		// skip extra request for each app
};

var search_term = opts.term.split(' ').join('_');
var file_name = ['results/apple_results_'+search_term+'_'+opts.country+'.txt'];

store.search(opts)
    .then( (results, err) => {
	fs.writeFile(file_name.toString(), JSON.stringify(results), (err) => {
	   if (err) throw err;
	   console.log('iOS apps saved!');
       });
   }).catch();
