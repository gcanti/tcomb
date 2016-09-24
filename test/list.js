/* globals describe, it */
var assert = require('assert');
var vm = require('vm');
var t = require('../index');
var util = require('./util');

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.list(type, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      util.throwsWithMessage(function () {
        t.list();
      }, '[tcomb] Invalid argument type undefined supplied to list(type, [name]) combinator (expected a type)');

      util.throwsWithMessage(function () {
        t.list(Point, 1);
      }, '[tcomb] Invalid argument name 1 supplied to list(type, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    var MyElement = t.struct({}, 'MyElement');
    var MyList = t.list(MyElement, 'MyList');
    var ListOfNumbers = t.list(t.Number, 'ListOfNumbers');
    var Path = t.list(Point, 'Path');

    it('should throw with a contextual error message if used with wrong arguments', function () {

      util.throwsWithMessage(function () {
        ListOfNumbers();
      }, '[tcomb] Invalid value undefined supplied to ListOfNumbers (expected an array of Number)');

      util.throwsWithMessage(function () {
        ListOfNumbers(['a']);
      }, '[tcomb] Invalid value "a" supplied to ListOfNumbers/0: Number');

      util.throwsWithMessage(function () {
        ListOfNumbers(1, ['root']);
      }, '[tcomb] Invalid value 1 supplied to root (expected an array of Number)');

    });

    it('should hydrate the elements of the list', function () {
      var instance = MyList([{}]);
      assert.equal(MyElement.is(instance[0]), true);
    });

    it('should hydrate the elements of the list in production', util.production(function () {
      var instance = MyList([{}]);
      assert.equal(MyElement.is(instance[0]), true);
    }));

    it('should be idempotent', function () {
      var numbers0 = [1, 2];
      var numbers1 = ListOfNumbers(numbers0);
      var numbers2 = ListOfNumbers(numbers1);
      assert.equal(numbers0 === numbers1, true);
      assert.equal(numbers1 === numbers2, true);

      var path0 = [{x: 0, y: 0}, {x: 1, y: 1}];
      var path1 = Path(path0);
      var path2 = Path(path1);
      assert.equal(path0 === path1, false);
      assert.equal(path1 === path2, true);
    });

    it('should be idempotent in production', util.production(function () {
      var numbers0 = [1, 2];
      var numbers1 = ListOfNumbers(numbers0);
      var numbers2 = ListOfNumbers(numbers1);
      assert.equal(numbers0 === numbers1, true);
      assert.equal(numbers1 === numbers2, true);

      var path0 = [{x: 0, y: 0}, {x: 1, y: 1}];
      var path1 = Path(path0);
      var path2 = Path(path1);
      assert.equal(path0 === path1, false);
      assert.equal(path1 === path2, true);
    }));

    it('should freeze the instance', function () {
      var instance = ListOfNumbers([1, 2]);
      assert.equal(Object.isFrozen(instance), true);
    });

    it('should not freeze the instance in production', util.production(function () {
      var instance = ListOfNumbers([1, 2]);
      assert.equal(Object.isFrozen(instance), false);
    }));

  });

  describe('is(x)', function () {

    var Path = t.list(Point);
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 1});

    it('should return true when x is a list of type instances', function () {
      assert.equal(Path.is([]), true);
      assert.equal(Path.is([p1, p2]), true);
      assert.equal(Path.is(1), false);
      assert.equal(Path.is([1]), false);
    });

    it('should return true when x is a list of type instances returned from vm', function () {
      assert.equal(Path.is(vm.runInNewContext('[]', { Array: Array })), true);
      assert.equal(Path.is(vm.runInNewContext('[p1, p2]', { Array: Array, p1: p1, p2: p2 })), true);
      assert.equal(Path.is(vm.runInNewContext('1', { Array: Array })), false);
      assert.equal(Path.is(vm.runInNewContext('[1]', { Array: Array })), false);
    });

    it('should be used as a predicate', function () {
      assert.equal([[p1, p2]].every(Path.is), true);
    });

  });

  describe('update(instance, patch)', function () {

    it('should return a new instance', function () {
      var ListOfStrings = t.list(t.String);
      var instance = ['a', 'b'];
      var newInstance = ListOfStrings.update(instance, {'$push': ['c']});
      assert.equal(newInstance !== instance, true);
      assert.deepEqual(newInstance, ['a', 'b', 'c']);
    });

  });

});
