var stringSimilarity = require('string-similarity');
var store = require('google-play-scraper');
var fs = require('fs');

main()
    .then( (resul, err) => {
	console.log(JSON.stringify(resul, null, 2));
	console.log(stringSimilarity.compareTwoStrings(process.argv[2].toUpperCase(), resul[0].title.toUpperCase())); 
    }).catch();  

async function main(){
    return  await scrapeApps(process.argv[2], process.argv[3], process.argv[4])
}

function scrapeApps(term, num, countr) { 
    opts = {
	term: term,     // Search expression
	lang: 'en',                // App language
	country: countr,  // Gplay store country 2 letter code
	num: num,      // Number of search results, max is 250
	price: 'all',            // all, free, paid
	fullDetail: true,         // if true an extra request is made for each app
	throttle: 10	       // Throttle to X requests per second
    };
    return res = store.search(opts)
}

function pruneResults(fullResults, searchTerms, country) {
    const prunedResults = fullResults.map(function(res) {
	return { title: res.title,
		 appId: res.appId,
		 url: res.url,
		 // summary: res.summary,
		 terms: searchTerms,
		 countries: country
	       };
    });
    return prunedResults
}			 
