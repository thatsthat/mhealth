var store = require('app-store-scraper');

// store.app({ id: 1273173293 }).then(console.log).catch(console.log);

store.search({
  term: 'galenus health',
  num: 10,
  page: 1,
  country: 'gb',
  lang: 'en'
})
  .then(console.log)
  .catch(console.log);