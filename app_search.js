var gStore = require('./gsearch.js')
var aStore = require('./asearch.js');
var fs = require('fs');

justDoIt()
    .then( (resul, err) => {
	const file_name = ['results/App_Results_'+process.argv[2]+'.txt'];
	fs.writeFile(file_name.toString(), JSON.stringify(resul, null, 2), (err) => {
	    if (err) throw err;
	    console.log('Apps saved!');
	});
    }).catch();  

async function justDoIt(){
    var terms = ['hay fever', 'hayfever', 'asthma', 'allergic rhinitis'];
    var countries = ['au', 'be'];
    var resAll = [];
    
    for (let i = 0; i < terms.length; i++) {
	for (let j = 0; j < countries.length; j++) { 
	    const resGoogle = await gStore.gScrape(terms[i], countries[j], process.argv[2])
	    resAll = resAll.concat(resGoogle);
	    const resApple = await aStore.aScrape(terms[i], countries[j], process.argv[2])
	    resAll = resAll.concat(resApple);
	}
    }
    return resAll
}
