const irreducible = require('./irreducible');

module.exports = irreducible('Date', x => x instanceof Date);
