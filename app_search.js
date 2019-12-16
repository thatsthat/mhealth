var gStore = require('google-play-scraper');
var aStore = require('app-store-scraper');
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
    var resAll = [];

    for (let i = 0; i < terms.length; i++) {
	for (let j = 0; j < countries.length; j++) { 
	    const resGoogle = await scrapeGoogle(terms[i], countries[j], process.argv[2])
	    resAll = resAll.concat(pruneGoogle(resGoogle, terms[i], countries[j]));
	    const resApple = await scrapeApple(terms[i], countries[j], process.argv[2])
	    resAll = resAll.concat(pruneApple(resApple, terms[i], countries[j]));
	    console.log(i);
	}
    }
    return resAll
}

function scrapeGoogle(terms, countr, nums) { 
    opts = {
	term: terms,     // Search expression
	lang: 'en',                // App language
	country: countr,  // Gplay store country 2 letter code
	num: nums,      // Number of search results, max is 250
	price: 'free:',            // all, free, paid
	fullDetail: false,         // if true an extra request is made for each app
	throttle: 10	       // Throttle to X requests per second
    };
    return res = gStore.search(opts)
}

function pruneGoogle(fullResults, searchTerms, country) {
    const prunedResults = fullResults.map(function(res) {
	return { title: res.title,
		 appId: res.appId,
		 url: res.url,
		 // summary: res.summary,
		 terms: searchTerms,
		 countries: country,
		 google: true,
		 apple: false
	       };
    });
    return prunedResults
}			 

function scrapeApple(terms, countr, nums) { 
    opts = {
	term: terms,     // Search expression
	lang: 'en-us',   // App language
	country: countr, // Country 2 letter code
	num: nums,       // Number of search results, max is 250
	page: 1,         // Hard code 1 page (investigate)
	idsOnly: false,  // skip extra request per app
    };
    return res = aStore.search(opts)
}

function pruneApple(fullResults, searchTerms, country) {
    const prunedResults = fullResults.map(function(res) {
	return { title: res.title,
		 appId: res.appId,
		 url: res.url,
		 // summary: res.summary,
		 terms: searchTerms,
		 countries: country,
		 google: false,
		 apple: true 
	       };
    });
    return prunedResults
}			 
