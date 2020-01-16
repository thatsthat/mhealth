var store = require('app-store-scraper');

module.exports = {

    aScrape: async (terms, countr, nums) => {
	let res = await store.search({
	    term: terms,       // Search expression
	    lang: 'en-us',     // App language
	    country : countr,  // iOS App Store country 2 letter code
	    num: nums,	       // Number of search results, default 50
	    page: 1,	       // Results page to retrieve
	    idsOnly: false     // skip extra request for each app
	})
	return pruneResults(res, terms, countr)
    }   
}
			
function pruneResults(fullResults, searchTerms, country) {
    var sc0re;
    return fullResults.map(res => {
	if (res.score == undefined)
	{
	    sc0re = '';
	}
	else
	{
	    sc0re = res.score;
	}
	return { title: res.title,
		 appId: res.appId,
		 url: res.url,
		 // description: res.description,
		 genre: res.primaryGenre,
		 terms: searchTerms,
		 countries: country,
		 store: 'Apple',
		 description: res.description.substring(0,500),
		 installs: '',
		 score: sc0re,
		 ratings: '',
		 updated: res.updated.substring(0,10)
	       };
    })
}
