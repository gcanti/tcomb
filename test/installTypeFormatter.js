/* globals describe, it */
var assert = require('assert');
var t = require('../');
var TypeFormatter = require('../lib/installTypeFormatter').TypeFormatter;

describe('TypeFormatter', function () {

  it('should format irreducibles', function () {
    var T = t.String;
    var header = TypeFormatter.header(T);
    assert.deepEqual(header, [ 'span',
      [ 'span', { style: 'font-weight: bolder;' }, 'String' ],
      ' (irreducible)'
    ]);
  });

});
