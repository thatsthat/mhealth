var gplay = require('google-play-scraper');

gplay.app({ appId: 'at.alysis.urticaria' })
  .then(console.log, console.log);