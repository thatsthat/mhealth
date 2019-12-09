var gplay = require('google-play-scraper');
var fs = require('fs');

opts = {
    term: process.argv[2],     // Search expression
    lang: 'en',                // App language
    country: process.argv[3],  // Gplay store country 2 letter code
    num: process.argv[4],      // Number of search results, max is 250
    price: 'free:',            // all, free, paid
    fullDetail: false          // if true an extra request is made for each app
};

var search_term = opts.term.split(' ').join('_');
var file_name = ['results/google_results_'+search_term+'_'+opts.country+'.txt'];

gplay.search(opts)
    .then( (results, err) => {
	fs.writeFile(file_name.toString(), JSON.stringify(results), (err) => {
	   if (err) throw err;
	   console.log('Android apps saved!');
        });
    }).catch();
