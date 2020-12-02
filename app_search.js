var gStore = require('./gsearch.js');
var aStore = require('./asearch.js');
var fs = require('fs');
var simil = require('string-similarity');
const parse2csv = require('json2csv');
const numApps = 200; //process.argv[2];

justDoIt()
  .then((resul, err) => {
    const file_name = ['results/App_eng_Results_' + numApps + '.csv'];
    const resFields = Object.keys(resul[0]);
    const opts = { fields: resFields, withBOM: true };
    const resul_csv = parse2csv.parse(resul, opts);
    fs.writeFile(file_name.toString(), resul_csv, (err) => {
      //fs.writeFile(file_name.toString(), JSON.stringify(resul_csv, null, 2), (err) => {
      if (err) throw err;
      console.log('Apps saved!');
    });
  }).catch();

async function justDoIt() {
  var terms = ['hay fever', 'hayfever', 'asthma', 'rhinitis', 'allergic rhinitis'];
  var countries = ['au', 'us', 'gb', 'be'];
  var resAll = [];

  for (let i = 0; i < terms.length; i++) {
    for (let j = 0; j < countries.length; j++) {
      console.log(`Searching ${terms[i]} in ${countries[j]} Google Play Store`)
      const resGoogle = await gStore.gScrape(terms[i], countries[j], numApps)
      resAll = resAll.concat(resGoogle);
      console.log(`Searching ${terms[i]} in ${countries[j]} iOS App Store`)
      const resApple = await aStore.aScrape(terms[i], countries[j], numApps)
      resAll = resAll.concat(resApple);
    }
  }
  resAll = resAll.filter(Boolean); // remove 'undefined' apps
  let firstRound = mergeDups(resAll);
  let secRound = await findMissing(firstRound);
  let secondRound = mergeDups(secRound);

  return postProc(secondRound)
}

function postProc(fullRes) { // Calculate average of scores and sum ratings
  return fullRes.map(res => {
    if (res.score_a.length == 1)
      res.score_a = res.score_a[0];
    else {
      let nonzScores = res.score_a.filter(elem => elem > 0);
      res.score_a = nonzScores.reduce(function(a, b) { return a + b }, 0) / nonzScores.length;
    }
    res.ratings_a = res.ratings_a.reduce(function(a, b) { return a + b }, 0);
    return res;
  });
}

function mergeDups(fullRes) {

  var groupedRes = [];
  var iterRes = fullRes;;

  while (iterRes.length > 0) {
    let currTitle = iterRes[0].title;
    // get currTitle and its duplicates (if any) into filtRes
    let filtRes = iterRes.filter(element => element.title.toUpperCase() == currTitle.toUpperCase());
    // remove currTitle and its duplicates from iterRes
    iterRes = iterRes.filter(element => element.title.toUpperCase() != currTitle.toUpperCase());
    // group all duplicates into a single app. Concatenate fields that are different
    let groupedObj = filtRes.reduce((ac, cv) => {
      ac.title = cv.title;
      // Merge some data fields in different ways --------------------------------
      if (!(ac.countries.includes(cv.countries)))
        ac.countries = ac.countries.concat([', ' + cv.countries])
      if (!(ac.terms.includes(cv.terms)))
        ac.terms = ac.terms.concat([', ' + cv.terms])
      if (!(ac.store.includes(cv.store)))
        ac.store = ac.store.concat([', ' + cv.store])
      if (!(ac.appId.includes(cv.appId)))
        ac.appId = ac.appId.concat([', ' + cv.appId])
      if (!(ac.genre.includes(cv.genre)))
        ac.genre = ac.genre.concat([', ' + cv.genre])
      if (!(ac.score_a.includes(cv.score_a[0])))
        ac.score_a.push(cv.score_a[0]);
      if (!(ac.ratings_a.includes(cv.ratings_a[0])))
        ac.ratings_a.push(cv.ratings_a[0]);
      if (!(ac.score_g) && (cv.score_g))
        ac.score_g = cv.score_g;
      if (!(ac.ratings_g) && (cv.ratings_g))
        ac.ratings_g = cv.ratings_g;
      if (!(ac.dev_g) && (cv.dev_g))
        ac.dev_g = cv.dev_g;
      if (!(ac.dev_a) && (cv.dev_a))
        ac.dev_a = cv.dev_a;
      // -------------------------------------------------------------------------
      return ac;
    })
    groupedRes.push(groupedObj);
  }
  return groupedRes;
}

async function findMissing(fullRes) {

  var missingApps = [];
  // Leave only apps present in one store
  var filtRes = fullRes.filter(element => element.store.split(',').length == 1)
  for (let i = 0; i < filtRes.length; i++) {
    var app = [];
    country = filtRes[i].countries.split(',', 1); // If multiple countries, take the first one
    store = filtRes[i].store;
    title = filtRes[i].title;
    shortTitle = title.substring(0, 15);
    if (store == 'Apple') {
      try { app = await gStore.gScrape(shortTitle, country[0], 5); }
      catch (e) { console.log('No app found'); }
    }
    else {
      try { app = await aStore.aScrape(shortTitle, country[0], 5); }
      catch (e) { console.log('No app found'); }
    }
    if ((app !== undefined) && (app.length > 0)) {
      var likely = simil.compareTwoStrings(shortTitle.toUpperCase(),
        app[0].title.toUpperCase().substring(0, 15));
      if (likely > 0.8) missingApps.push(app[0]);
    }
  }
  return resAll = fullRes.concat(missingApps)
}
