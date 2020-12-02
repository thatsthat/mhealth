var store = require('app-store-scraper');

store.search({
  term: 'asthma',
  num: 20,
  page: 3,
  country : 'us',
  lang: 'lang'
})
.then(console.log)
.catch(console.log);