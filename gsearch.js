var gplay = require('google-play-scraper');
var langDetect = require('languagedetect');

module.exports = {

	gScrape: async function(terms, countr, nums) {
		let res = await gplay.search({
			term: terms, // Search expression
			lang: 'en', // App language
			country: countr, // Gplay store country 2 letter code
			num: nums, // Number of search results, max is 250
			price: 'all', // all, free, paid
			fullDetail: true, // if true an extra request is made for each app
			throttle: 5 // Throttle to X requests per second
		}).catch(e => console.log('Error: ', e.message));
		res = await getFullRes(res).catch(e => console.log('Error: ', e.message));
		return pruneGoogle(res, terms, countr);
	}
}

async function getFullRes(shortRes) {
	return Promise.all(
		shortRes.map(async a => {
			return await gplay.app({ appId: a.appId })
				.catch(e => console.log('Error: ', e.message));
		})
	)
}

function pruneGoogle(fullResults, searchTerms, country, err) {
	const relevCats = ['Health & Fitness', 'Medical', 'Weather'];
	const filtRes2 = fullResults.filter(Boolean); // Remove some 'undefined' apps
	const filtRes1 = filtRes2.filter(element => relevCats.includes(element.genre)) // Leave only apps present in one store
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
		if ((eps.length) && (eps[0][0] == 'english'))
			return true;
		else
			return false;
	});
	return filtRes.map(function(res) {
		var d = new Date(res.updated);
		date = [d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()];
		return {
			title: res.title,
			appId: res.appId,
			url: res.url,
			// summary: res.summary,
			genre: res.genre,
			terms: searchTerms,
			countries: country,
			store: 'Google',
			description: res.description.substring(0, 2500),
			installs: res.installs,
			score: res.score,
			ratings: res.ratings,
			updated: date[0]
		}
	});
}
