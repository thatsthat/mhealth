var store = require('google-play-scraper');
var fs = require('fs');

justDoIt()
    .then( (resul, err) => {
	const file_name = ['results/google_results_'+process.argv[2]+'.txt'];
	fs.writeFile(file_name.toString(), JSON.stringify(resul, null, 2), (err) => {
	    if (err) throw err;
	    console.log('iOS apps saved!');
	});
    }).catch();  

async function justDoIt(){
    var terms = ['hay fever', 'hayfever', 'asthma', 'allergic rhinitis'];
    var countries = ['us', 'au'];
    var resu = [];

    for (let i = 0; i < terms.length; i++) {
	for (let j = 0; j < countries.length; j++) { 
	    const results2 = await scrapeApps(terms[i], countries[j], process.argv[2])
	    resu = resu.concat(pruneResults(results2, terms[i], countries[j]));
	    console.log(i);
	}
    }
    return resu
}

function scrapeApps(terms, countr, nums) { 
    opts = {
	term: terms,     // Search expression
	lang: 'en',                // App language
	country: countr,  // Gplay store country 2 letter code
	num: nums,      // Number of search results, max is 250
	price: 'free:',            // all, free, paid
	fullDetail: false,         // if true an extra request is made for each app
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
