var store = require('app-store-scraper');
var langDetect = require('languagedetect');

module.exports = {

	aScrape: async(terms, countr, nums) => {
		let res = await store.search({
			term: terms, // Search expression
			lang: 'en-us', // App language
			country: countr, // iOS App Store country 2 letter code
			num: nums, // Number of search results, default 50
			page: 1, // Results page to retrieve
			idsOnly: false, // skip extra request for each app
			ratings: true
		}).catch(e => console.log('Error: ', e.message));
		return pruneResults(res, terms, countr)
	}
}

function pruneResults(fullResults, searchTerms, country) {
	if (fullResults === undefined)
		return fullResults;
	var sc0re;
	var engLang;
	var relevCats = ['Health & Fitness', 'Medical', 'Weather'];
	const filtRes1 = fullResults.filter(element => relevCats.includes(element.primaryGenre)) // Leave only apps present in one store
	var err = 'no error';

	const lang = [];
	const filtRes = filtRes1.filter(element => {
		const lngDetector = new langDetect();
		try {
			var eps = lngDetector.detect(element.description.substring(0, 250));
		}
		catch (e) {
			err = e;
		}
		if ((eps.length) && (eps[0][0] == 'english')) {
			engLang = true;
			return true;
		}
		else {
			engLang = false;
			return true;
		}
	});
	return filtRes.map(res => {
		if (res.score == undefined) {
			sc0re = 0;
		}
		else {
			sc0re = res.score;
		}
		return {
			title: res.title,
			appId: res.appId,
			url: res.url,
			// description: res.description,
			genre: res.primaryGenre,
			terms: searchTerms,
			countries: country,
			english: engLang,
			store: 'Apple',
			inpvars: [searchTerms, country, 'Apple'],
			description: res.description.substring(0, 2500),
			installs: '',
			score_g: '',
			ratings_g: '',
			score_a: [sc0re],
			ratings_a: [res.reviews],
			dev_g: '',
			dev_a: res.developer,
			updated: res.updated.substring(0, 10)
		};
	})
}
