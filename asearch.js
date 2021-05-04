var store = require("app-store-scraper");
var langDetect = require("languagedetect");

module.exports = {
  aScrape: async (terms, countr, lng, nums) => {
    let res = await store
      .search({
        term: terms, // Search expression
        lang: lng, // App language
        country: countr, // iOS App Store country 2 letter code
        num: nums, // Number of search results, default 50
        page: 1, // Results page to retrieve
        idsOnly: false, // skip extra request for each app
        ratings: true,
        maxAttempts: 3,
        attemptWait: 5,
      })
      .catch((e) => console.log("4Error: ", e.message));
    return pruneResults(res, terms, countr, lng);
  },
};

function pruneResults(fullResults, searchTerms, country, lang) {
  if (fullResults === undefined) return fullResults;
  var sc0re;
  var relevCats = ["Health & Fitness", "Medical"];
  const filtRes1 = fullResults.filter((element) =>
    relevCats.includes(element.primaryGenre)
  ); // Leave only apps present in one store
  var err = "no error";

  const filtRes = filtRes1.filter((element) => {
    const lngDetector = new langDetect();
    try {
      var eps = lngDetector.detect(element.description.substring(0, 250));
    } catch (e) {
      err = e;
    }
    if (eps.length && lang == "en" && eps[0][0] == "english") {
      return true;
    }
    else if (eps.length && lang == "es" && eps[0][0] == "spanish") {
      return true;
    }
    else if (eps.length && lang == "de" && eps[0][0] == "german") {
      return true;
    }
    else {
      return false;
    }
  });
  return filtRes.map((res) => {
    if (res.score == undefined) {
      sc0re = 0;
    } else {
      sc0re = res.score;
    }
    return {
      appId: res.appId,
      title: res.title,
      url: res.url,
      // description: res.description,
      genre: res.primaryGenre,
      terms: searchTerms,
      countries: country,
      languages: lang,
      store: "Apple",
      //inpvars: [searchTerms, country, 'Apple'],
      description: res.description.substring(0, 2500),
      installs: "",
      score_a: sc0re,
      ratings_a: res.reviews,
      score_g: "",
      ratings_g: "",
      dev_a: res.developer,
      dev_g: "",
      updated: res.updated.substring(0, 10),
    };
  });
}
