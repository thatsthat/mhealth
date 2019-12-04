var store = require('app-store-scraper');

store.search({
    term: 'hay fever',
    num: 3,
    page: 1,
    country : 'us',
    idsOnly: false,
    lang: 'en-us'
})
    .then(console.log)
    .catch(console.log);
