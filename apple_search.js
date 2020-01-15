var store = require('app-store-scraper');
var fs = require('fs');

justDoIt()
    .then( (resul, err) => {
	console.log(resul)
//	console.log(JSON.stringify(resul, null, 2));
    }).catch();  

async function justDoIt(){
    var resu =  await scrapeApps(process.argv[2], process.argv[3], process.argv[4]);
    return pruneResults(resu, process.argv[2], process.argv[3])
}

function scrapeApps(terms, countr, nums) { 
    opts = {
	term: terms,// Search expression
	lang: 'en-us', 		// App language
	country : countr,  // iOS App Store country 2 letter code
	num: nums,	// Number of search results, default 50
	page: 1,	// Results page to retrieve
	idsOnly: false 		// skip extra request for each app
    };
    return store.search(opts)
}

function pruneResults(fullResults, searchTerms, country) {
    const prunedResults = fullResults.map(function(res) {
	return { title: res.title,
		 appId: res.appId,
		 id: res.id,
		 url: res.url,
		 // description: res.description,
		 primaryGenre: res.primaryGenre,
		 terms: searchTerms,
		 countries: country
	       };
    });
    return prunedResults
}			 
