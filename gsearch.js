var gplay = require('google-play-scraper');

// gScrape();

module.exports = {

    gScrape: async function (terms, countr, nums) {
	let res = await gplay.search({
	    term: terms,     // Search expression
	    lang: 'en',                // App language
	    country: countr,  // Gplay store country 2 letter code
	    num: nums,      // Number of search results, max is 250
	    price: 'all',            // all, free, paid
	    fullDetail: true,         // if true an extra request is made for each app
	    throttle: 5	       // Throttle to X requests per second
	})
	res = await getFullRes(res);
	return pruneGoogle(res, terms, countr);
	//console.log(res);	
    }
}    

async function getFullRes(shortRes) {
    return Promise.all(
	shortRes.map(async a => {
	    return await gplay.app({ appId: a.appId })
	}) 		
    )
}

function pruneGoogle(fullResults, searchTerms, country) {
    return fullResults.map(function(res) {
	return { title: res.title,
		 appId: res.appId,
		 url: res.url,
		 // summary: res.summary,
		 genre: res.genre,
		 terms: searchTerms,
		 countries: country,
		 store: 'Google'
	       }
    });
}
