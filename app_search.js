var gStore = require("./gsearch.js");
var aStore = require("./asearch.js");
var fs = require("fs");
var simil = require("string-similarity");
const parse2csv = require("json2csv");
const SQLite = require("better-sqlite3");
const numApps = 3; //process.argv[2];

// Connect to sqlite db and initialize
const db = new SQLite('results/apps.sqlite');
prepareDB(db);

main(db)
  .then((resul, err) => {
    // Export apps array to CSV file
    const file_name = ["results/App_german_Results_" + numApps + ".csv"];
    const resFields = Object.keys(resul[0]);
    const opts = { fields: resFields, withBOM: true };
    const resul_csv = parse2csv.parse(resul, opts);
    fs.writeFile(file_name.toString(), resul_csv, (err) => {
      if (err) throw err;
      console.log("Apps saved from SQL!");
    });
    db.close((err) => {
      if (err) { return console.error(err.message); }
      console.log('Close the database connection.');
    });
  })
  .catch();

async function main(db) {
  // Get variable with all input parameters
  var inpCountrs = prepareInput();
  var langA = [];
  var langG = [];
  var countr = [];

  //console.log(inpCountrs);
  // Iterate over list of countries
  for (let i = 0; i < inpCountrs.length; i++) {
    countr = inpCountrs[i].country;
    // Iterate for each language in that country
    for (let j = 0; j < inpCountrs[i].languages.length; j++) {
      langA = inpCountrs[i].languages[j].opts.apple.lang;
      langG = inpCountrs[i].languages[j].opts.google.lang;
      // Iterate for each keyword in that language
      for (let k = 0; k < inpCountrs[i].languages[j].keyWords.length; k++) {
        const keyWord = inpCountrs[i].languages[j].keyWords[k];
        console.log(`Searching ${keyWord} in ${countr} Google Play Store`);
        const resGoogle = await gStore.gScrape(keyWord, countr, langA, numApps);
        saveDB(resGoogle, db);
        console.log(`Searching ${keyWord} in ${countr} iOS App Store`);
        const resApple = await aStore.aScrape(keyWord, countr, langG, numApps);
        saveDB(resApple, db);
      };
    };
  };

  // read list of apps from DB
  let resAll = db.prepare("SELECT * FROM apps").all();
  resAll = resAll.filter(Boolean); // remove 'undefined' apps
  let firstRound = mergeDups(resAll);
  let secRound = await findMissing(firstRound);
  let secondRound = mergeDups(secRound);
  //let finalRes = postProc(secondRound)
  return secondRound;
}

function postProc(fullRes) {
  // Calculate average of scores and sum ratings
  return fullRes.map((res) => {

    if (res.score_a.length == 1) res.score_a = res.score_a[0];
    else {
      let nonzScores = res.score_a.filter((elem) => elem > 0);
      res.score_a =
        nonzScores.reduce(function (a, b) {
          return a + b;
        }, 0) / nonzScores.length;
    }
    res.ratings_a = res.ratings_a.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (res.summary)
      res.description = res.summary.concat(", ", res.description);
    return res;
  });
}

function mergeDups(fullRes) {
  var groupedRes = [];
  var iterRes = fullRes;

  while (iterRes.length > 0) {
    let currTitle = iterRes[0].title;
    // get currTitle and its duplicates (if any) into filtRes
    let filtRes = iterRes.filter(
      (element) => element.title.toUpperCase() == currTitle.toUpperCase()
    );
    // remove currTitle and its duplicates from iterRes
    iterRes = iterRes.filter(
      (element) => element.title.toUpperCase() != currTitle.toUpperCase()
    );
    // group all duplicates into a single app. Concatenate fields that are different
    let groupedObj = filtRes.reduce((ac, cv) => {
      ac.title = cv.title;
      // Merge some data fields in different ways --------------------------------
      if (!ac.countries.includes(cv.countries))
        ac.countries = ac.countries.concat([", " + cv.countries]);
      if (!ac.terms.includes(cv.terms))
        ac.terms = ac.terms.concat([", " + cv.terms]);
      if (!ac.terms.includes(cv.languages))
        ac.terms = ac.languages.concat([", " + cv.languages]);
      if (!ac.store.includes(cv.store))
        ac.store = ac.store.concat([", " + cv.store]);
      if (!ac.appId.includes(cv.appId))
        ac.appId = ac.appId.concat([", " + cv.appId]);
      if (!ac.genre.includes(cv.genre))
        ac.genre = ac.genre.concat([", " + cv.genre]);
      /* FIXME
      if (!ac.score_a.includes(cv.score_a[0])) ac.score_a.push(cv.score_a[0]);
      if (!ac.ratings_a.includes(cv.ratings_a[0])) ac.ratings_a.push(cv.ratings_a[0]);
      */
      ac.score_a = cv.score_a;
      ac.ratings_a = cv.ratings_a;
      // /FIXME
      if (!ac.summary && cv.summary) ac.summary = cv.summary;
      if (!ac.score_g && cv.score_g) ac.score_g = cv.score_g;
      if (!ac.ratings_g && cv.ratings_g) ac.ratings_g = cv.ratings_g;
      if (!ac.dev_g && cv.dev_g) ac.dev_g = cv.dev_g;
      if (!ac.dev_a && cv.dev_a) ac.dev_a = cv.dev_a;
      // -------------------------------------------------------------------------
      return ac;
    });
    groupedRes.push(groupedObj);
  }
  return groupedRes;
}

async function findMissing(fullRes) {
  var missingApps = [];
  // Leave only apps present in one store
  var filtRes = fullRes.filter(
    (element) => element.store.split(",").length == 1
  );
  for (let i = 0; i < filtRes.length; i++) {
    var app = [];
    country = filtRes[i].countries.split(",", 1); // If multiple countries, take the first one
    store = filtRes[i].store;
    title = filtRes[i].title;
    shortTitle = title.substring(0, 15);
    if (store == "Apple") {
      try {
        app = await gStore.gScrape(shortTitle, country[0], 5);
      } catch (e) {
        console.log("No app found");
      }
    } else {
      try {
        app = await aStore.aScrape(shortTitle, country[0], 5);
      } catch (e) {
        console.log("No app found");
      }
    }
    if (app !== undefined && app.length > 0) {
      var likely = simil.compareTwoStrings(
        shortTitle.toUpperCase(),
        app[0].title.toUpperCase().substring(0, 15)
      );
      if (likely > 0.8) missingApps.push(app[0]);
    }
  }
  return (resAll = fullRes.concat(missingApps));
}

function prepareDB(db) {
  // Create apps table with all properties
  db.prepare('DROP TABLE IF EXISTS apps').run();
  db.prepare(`CREATE TABLE apps (appId TEXT,
      title TEXT,
      url  TEXT,
      genre TEXT,
      terms TEXT,
      countries TEXT,
      languages TEXT,
      store TEXT,
      description TEXT,
      summary TEXT,
      installs  TEXT,
      score_a TEXT,
      ratings_a TEXT,
      score_g TEXT,
      ratings_g TEXT,
      dev_a TEXT,
      dev_g TEXT,
      updated TEXT);`)
    .run();
  db.pragma("synchronous = 1");
  db.pragma("journal_mode = wal");
}

function saveDB(resul, dataBase) {
  // Insert all apps from json array into sql table
  resul.map((res) => {
    dataBase.prepare(`INSERT OR REPLACE INTO apps VALUES (
      @appId,
      @title,
      @url,
      @genre,
      @terms,
      @countries,
      @languages,
      @store,
      @description,
      @summary,
      @installs,
      @score_a,
      @ratings_a,
      @score_g,
      @ratings_g,
      @dev_a,
      @dev_g,
      @updated);`).run(res);;
  });
}

function prepareInput() {

  // Define set of keywords for each language
  const engKW = ['urticaria', 'hive', 'hives', 'wheal', 'weal',
    'angio-edema', 'angioedema', 'itch', 'pruritus'];
  const spanKW = ['urticaria', 'roncha', 'ronchas', 'habón',
    'habon', 'angioedema', 'picor', 'prurito'];
  const gerKW = ['urtikaria', 'nesselsucht', 'nesselfieber',
    'quaddel', 'angioödem', 'juckreiz', 'pruritus'];

  // Define each language 
  const langs = {
    english: {
      opts: {
        apple: { lang: "en" },
        google: { lang: "en" }
      },
      keyWords: engKW
    },
    spanish: {
      opts: {
        apple: { lang: "es" },
        google: { lang: "es" }
      },
      keyWords: spanKW
    },
    german: {
      opts: {
        apple: { lang: "de" },
        google: { lang: "de" }
      },
      keyWords: gerKW
    }
  }

  // Define set of languages for each country
  const countries = [
    {
      country: 'us',
      languages: [langs.english, langs.spanish]
    },
    {
      country: 'ca',
      languages: [langs.english]
    },
    {
      country: 'gb',
      languages: [langs.english]
    },
    {
      country: 'au',
      languages: [langs.english]
    },
    {
      country: 'es',
      languages: [langs.spanish]
    },
    {
      country: 'ec',
      languages: [langs.spanish]
    },
    {
      country: 'ar',
      languages: [langs.spanish]
    },
    {
      country: 'co',
      languages: [langs.spanish]
    },
    {
      country: 'cl',
      languages: [langs.spanish]
    },
    {
      country: 'mx',
      languages: [langs.spanish]
    },
    {
      country: 'de',
      languages: [langs.german, langs.english]
    },
    {
      country: 'ch',
      languages: [langs.german, langs.english]
    },
    {
      country: 'at',
      languages: [langs.german, langs.english]
    }
  ]
  return countries;
}