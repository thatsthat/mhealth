var gplay = require("google-play-scraper");
var langDetect = require("languagedetect");

module.exports = {
  gScrape: async function (terms, countr, lng, nums) {
    let res = await gplay
      .search({
        term: terms, // Search expression
        lang: lng, // App language
        country: countr, // Gplay store country 2 letter code
        num: nums, // Number of search results, max is 250
        price: "all", // all, free, paid
        fullDetail: true, // if true an extra request is made for each app
        throttle: 5, // Throttle to X requests per second
      })
      .catch((e) => console.log("2Error: ", e.message));
    res = await getFullRes(res).catch((e) =>
      console.log("3Error: ", e.message)
    );
    return pruneResults(res, terms, countr, lng);
  },
};

async function getFullRes(shortRes) {
  return Promise.all(
    shortRes.map(async (a) => {
      return await gplay
        .app({ appId: a.appId })
        .catch((e) => console.log("1Error: ", e.message));
    })
  );
}

function pruneResults(fullResults, searchTerms, country, lang, err) {
  const relevCats = ["Health & Fitness", "Medical"];
  var engLangG;
  if (fullResults === undefined) return fullResults;

  const filtRes2 = fullResults.filter(Boolean); // Remove some 'undefined' apps
  const filtRes1 = filtRes2.filter((element) =>
    relevCats.includes(element.genre)
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
    var d = new Date(res.updated);
    var date = [d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()];
    return {
      appId: res.appId,
      title: res.title,
      url: res.url,
      genre: res.genre,
      terms: searchTerms,
      countries: country,
      languages: lang,
      store: "Google",
      description: res.summary.concat(", ", res.description.substring(0, 2500)),
      installs: res.installs,
      //score_a: [0],
      //ratings_a: [0],
      score_a: 0,
      ratings_a: 0,
      score_g: res.score,
      ratings_g: res.ratings,
      dev_a: "",
      dev_g: res.developer,
      updated: date[0],
    };
  });
}
