var gplay = require('google-play-scraper');

gplay.search({
    term: "panda",
    num: 2
  }).then(console.log, console.log);