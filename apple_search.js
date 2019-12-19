var store = require('app-store-scraper');
var fs = require('fs');

justDoIt()
    .then( (resul, err) => {
//	const file_name = ['results/apple_results_'+process.argv[2]+'.txt'];
//	fs.writeFile(file_name.toString(), JSON.stringify(resul, null, 2), (err) => {
//	    if (err) throw err;
	console.log(resul)
//	console.log(JSON.stringify(resul, null, 2));
//	});
    }).catch();  

async function justDoIt(){
    var terms = ['hay fever'];//, 'hayfever', 'asthma', 'allergic rhinitis'];
    var countries = ['us'];
    var resu = [];

    for (let i = 0; i < terms.length; i++) {
	for (let j = 0; j < countries.length; j++) { 
	    const results2 = await scrapeApps(terms[i], countries[j], process.argv[2], 1)
	    resu = resu.concat(pruneResults(results2, terms[i], countries[j]));
//	    console.log(i);
	}
    }
    return resu
}

function scrapeApps(terms, countr, nums, pages) { 
    opts = {
	term: terms,// Search expression
	lang: 'en-us', 		// App language
	country : countr,  // iOS App Store country 2 letter code
	num: nums,	// Number of search results, default 50
	page: pages,	// Results page to retrieve
	idsOnly: false 		// skip extra request for each app
    };
    return res = store.search(opts)
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
