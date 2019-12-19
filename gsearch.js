var gplay = require('google-play-scraper');

justDoIt();

async function justDoIt() {

    let res = await gplay.search({
	throttle: 5,
	term: "hay fever",
	num: 4,
	fullDetail: true
    })
    
    res = await getFullRes(res);
    res= pruneGoogle(res);
    console.log(res);
    
}
 
async function getFullRes(shortRes) {
    return Promise.all(
	shortRes.map(async a => {
	return await gplay.app({ appId: a.appId })
	}) 		
    )
}
   
function pruneGoogle(fullResults) {
    return fullResults.map(function(res) {
	return { title: res.title,
		 appId: res.appId,
		 url: res.url,
		 genre: res.genre,
		 genreId: res.genreId
		 // summary: res.summary,
	       };
    });
}
