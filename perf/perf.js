//
// ! remember to run `npm dist` before !
//

var Benchmark = require('benchmark');
var t = require('../dist/tcomb.min');

function getHz(bench) {
  var result = 1 / (bench.stats.mean + bench.stats.moe);
  return isFinite(result) ? result : 0;
}

function onComplete() {
  this.forEach(function (bench) {
    console.log(bench.name + ' ' + getHz(bench) + ' ops/sec'); // eslint-disable-line no-console
  });
}

var map = {};

for (var i = 0; i < 10 ; i++) {
  map['a' + i] = i;
}

var spec = { a1: { $set: 2 } };

function updateTest() {
  var obj = t.update(map, spec);
  obj.a1;
}

Benchmark.Suite({ })
  .add('updateTest', updateTest)
  .on('complete', onComplete)
  .run({ async: true });
