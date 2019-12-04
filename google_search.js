var gplay = require('google-play-scraper');

gplay.search({
    term: "hayfever",
    lang: "en",
    country: "us",
    price: "free",
    num: 3
}).then(console.log, console.log);
