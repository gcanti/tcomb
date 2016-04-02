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

//
// vanilla
//

function ClassType(name) {
  this.name = name;
}

var classInput = 'giulio';

function ClassVersion() {
  new ClassType(classInput);
}

//
// t.struct
//

var structInput = {name: 'giulio'};

var StructType = t.struct({
  name: t.String
});

function StructVersion() {
  new StructType(structInput);
}

Benchmark.Suite({ })
  .add('ClassVersion', ClassVersion)
  .add('StructVersion', StructVersion)
  .on('complete', onComplete)
  .run({ async: true });

/*

  ======================
  Results (node v0.12.2)
  ======================

  (development)
  var t = require('../');
  ClassVersion 96726638.34147379 ops/sec
  StructVersion 173322.08316550445 ops/sec

  ---

  (development build)
  var t = require('../dist/tcomb');
  ClassVersion 97459116.74105316 ops/sec
  StructVersion 547549.8587466488 ops/sec

  ---

  (production build) `Object.freeze` calls and asserts stripped out
  var t = require('../dist/tcomb.min');
  ClassVersion 98850069.98176897 ops/sec
  StructVersion 2272302.152337918 ops/sec

*/