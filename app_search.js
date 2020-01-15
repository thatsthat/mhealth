var gStore = require('./gsearch.js')
var aStore = require('./asearch.js');
var fs = require('fs');
var simil = require('string-similarity'); 

justDoIt()
    .then( (resul, err) => {
	const file_name = ['results/App_Results_'+process.argv[2]+'.txt'];
	fs.writeFile(file_name.toString(), JSON.stringify(resul, null, 2), (err) => {
	    if (err) throw err;
	    console.log('Apps saved!');
	});
    }).catch();  

async function justDoIt(){
    var terms = ['hay fever', 'hayfever', 'asthma', 'rhinitis', 'allergic rhinitis'];
    // var terms = ['rhinitis', 'allergic rhinitis'];
    var countries = ['au', 'us', 'gb', 'be'];
    var resAll = [];
    
    for (let i = 0; i < terms.length; i++) {
	for (let j = 0; j < countries.length; j++) { 
	    const resGoogle = await gStore.gScrape(terms[i], countries[j], process.argv[2])
	    resAll = resAll.concat(resGoogle);
	    const resApple = await aStore.aScrape(terms[i], countries[j], process.argv[2])
	    resAll = resAll.concat(resApple);
	}
    }
    var firstRound = mergeDups(resAll);
    var secRound = await findMissing(firstRound);

    return mergeDups(secRound);
}

function mergeDups(fullRes) {

    var groupedRes = [];
    var iterRes = fullRes;;

    while (iterRes.length>0) {
	currTitle = iterRes[0].title;
	var filtRes = iterRes.filter(element => element.title.toUpperCase() == currTitle.toUpperCase());
	iterRes = iterRes.filter(element => element.title.toUpperCase() != currTitle.toUpperCase());
	groupedObj = filtRes.reduce((ac, cv) => {
	    ac.title = cv.title;
	    if (!(ac.countries.includes(cv.countries))) {
		ac.countries = ac.countries.concat([', ' + cv.countries])}
	    if (!(ac.terms.includes(cv.terms))) {
		ac.terms = ac.terms.concat([', ' + cv.terms])}
	    if (!(ac.store.includes(cv.store))) {
		ac.store = ac.store.concat([', ' + cv.store])}
	    if (!(ac.appId.includes(cv.appId))) {
		ac.appId = ac.appId.concat([', ' + cv.appId])}
	    if (!(ac.genre.includes(cv.genre))) {
		ac.genre = ac.genre.concat([', ' + cv.genre])}
	    return ac;
	})
	groupedRes.push(groupedObj);
    }
    return groupedRes;
}

async function findMissing(fullRes) {

    var missingApps = [];
    // debugger;
    var filtRes = fullRes.filter(element => element.store.split(',').length == 1) // Leave only apps present in one store

    for (let i=0; i<filtRes.length; i++) {
	var app = [];
	country = filtRes[i].countries.split(',', 1); 			// If multiple countries, take the first one
	store = filtRes[i].store;
	title = filtRes[i].title;
	shortTitle = title.substring(0, 15);
	if (store == 'Apple') {
	    try { app = await gStore.gScrape(shortTitle, country[0], 1); }
	    catch(e) { console.log('No app found'); }
	}
	else {
	    try { app = await aStore.aScrape(shortTitle, country[0], 1); }
	    catch(e) { console.log('No app found'); }
	}
	if (app.length > 0) {
	    var likely = simil.compareTwoStrings(shortTitle.toUpperCase(), app[0].title.toUpperCase().substring(0, 15));    
	    if (likely > 0.8) missingApps.push(app[0]);
	}
    }
    return resAll = fullRes.concat(missingApps)
}
