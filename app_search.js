var gStore = require("./gsearch.js");
var aStore = require("./asearch.js");
var fs = require("fs");
var simil = require("string-similarity");
const parse2csv = require("json2csv");
const SQLite = require("better-sqlite3");
const numApps = 10; //process.argv[2];

// Connect to sqlite db
const db = new SQLite('results/apps.sqlite');

// Create apps table with all properties
db.prepare('DROP TABLE IF EXISTS apps').run();
db.prepare(`CREATE TABLE apps (appId TEXT,
      title TEXT,
      url  TEXT,
      genre TEXT,
      terms TEXT,
      countries TEXT,
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

main(db)
  .then((resul, err) => {
    // Read apps from DB
    resulSQL = db.prepare("SELECT * FROM apps").all();
    // Export apps array to CSV file
    const file_name = ["results/App_german_Results_" + numApps + ".csv"];
    const resFields = Object.keys(resul[0]);
    const opts = { fields: resFields, withBOM: true };
    const resul_csv_sql = parse2csv.parse(resulSQL, opts);
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
  var terms = [
    "hay fever",
    "hayfever",
    "asthma"];
  /*  "rhinitis",
      "allergic rhinitis",
      "allergische schnupfen",
      "allergische rhinitis",
      "schnupfen",
      "heuschnupfen",
      "heufieber",
    ];
  */
  var countries = ['us', 'gb', 'au'];
  //var resAll = [];

  for (let i = 0; i < terms.length; i++) {
    for (let j = 0; j < countries.length; j++) {
      console.log(`Searching ${terms[i]} in ${countries[j]} Google Play Store`);
      const resGoogle = await gStore.gScrape(terms[i], countries[j], numApps);
      //console.log(resGoogle[0]);
      saveDB(resGoogle, db);
      //resAll = resAll.concat(resGoogle);
      console.log(`Searching ${terms[i]} in ${countries[j]} iOS App Store`);
      const resApple = await aStore.aScrape(terms[i], countries[j], numApps);
      saveDB(resApple, db);
      //resAll = resAll.concat(resApple);
    }
  }
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

function prepareInput(countries) {

  // Define set of keywords for each language
  const engKW = ['urticaria', 'hive', 'hives', 'wheal', 'weal',
    'angio-edema', 'angioedema', 'itch', 'pruritus'];
  const spanWK = ['urticaria', 'roncha', 'ronchas', 'habón',
    'habon', 'angioedema', 'picor', 'prurito'];
  const gerKW = ['urtikaria', 'nesselsucht', 'nesselfieber',
    'quaddel', 'angioödem', 'juckreiz', 'pruritus'];

  // Define each language 
  const langs = {
    english: {
      opts: {
        apple: { lang: "en-us" },
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
  const countries = {
    us: {
      country: 'us';
      languages: [langs.english, langs.spanish];
    },
    ca: {
      country: 'ca';
      languages: [langs.english];
    },
    uk: {
      country: 'uk';
      languages: [langs.english];
    },
    au: {
      country: 'au';
      languages: [langs.english]
    },
    es: {
      country: 'es';
      languages: [langs.spanish]
    },
    ec: {
      country: 'ec';
      languages: [langs.spanish]
    },
    ar: {
      country: 'ar';
      languages: [langs.spanish]
    },
    co: {
      country: 'co';
      languages: [langs.spanish]
    },
    cl: {
      country: 'cl';
      languages: [langs.spanish]
    },
    mx: {
      country: 'mx';
      languages: [langs.spanish]
    },
    de: {
      country: 'de';
      languages: [langs.german, langs.english]
    },
    ch: {
      country: 'ch';
      languages: [langs.german, langs.english]
    },
    at: {
      country: 'at';
      languages: [langs.german, langs.english]
    }
  }
}