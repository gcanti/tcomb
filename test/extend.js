/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
}, 'Point');

var PointInterface = t.inter({
  x: t.Number,
  y: t.Number
});

describe('extend(combinator, mixins, [name])', function () {

  it('should throw if used with wrong arguments', function () {
    throwsWithMessage(function () {
      t.struct.extend();
    }, '[tcomb] Invalid argument mixins supplied to extend(combinator, mixins, options), expected an array');
    throwsWithMessage(function () {
      t.struct.extend([1]);
    }, '[tcomb] Invalid argument mixins[0] supplied to extend(combinator, mixins, options), expected an object, struct, interface or a refinement (of struct or interface)');
  });

  it('should handle defaultProps', function () {
    var A1 = t.struct({ a: t.String }, { defaultProps: { a: 'default-a' } });
    var B1 = t.struct({ b: t.String }, { defaultProps: { b: 'default-b' } });
    var C1 = t.struct.extend([A1, B1, { z: t.Number }], { defaultProps: { z: 1 } });
    assert.deepEqual(C1.meta.defaultProps, {
      a: 'default-a',
      b: 'default-b',
      z: 1
    });
    assert.deepEqual(C1({}), {
      a: 'default-a',
      b: 'default-b',
      z: 1
    });

    var A2 = t.struct({ a: t.String }, { defaultProps: { a: 'default-a' } });
    var B2 = t.struct({ b: t.String }, { defaultProps: { b: 'default-b' } });
    var C2 = t.struct.extend([A2, B2, { z: t.Number }], 'C2');
    assert.deepEqual(C2.meta.defaultProps, {
      a: 'default-a',
      b: 'default-b'
    });
    assert.deepEqual(C2({ z: 2 }), {
      a: 'default-a',
      b: 'default-b',
      z: 2
    });
  });

  it('should override defaultProps', function () {
    var A1 = t.struct({ a: t.String }, { defaultProps: { a: 'default-a' } });
    var B1 = t.struct({ b: t.String }, { defaultProps: { b: 'default-b' } });
    var C1 = t.struct.extend([A1, B1, { z: t.Number }], { defaultProps: {
      a: 'override-c',
      b: 'override-c',
      z: 1
    }});
    assert.deepEqual(A1.meta.defaultProps, {
      a: 'default-a'
    });
    assert.deepEqual(B1.meta.defaultProps, {
      b: 'default-b'
    });
    assert.deepEqual(C1.meta.defaultProps, {
      a: 'override-c',
      b: 'override-c',
      z: 1
    });
    assert.deepEqual(C1({}), {
      a: 'override-c',
      b: 'override-c',
      z: 1
    });
  });

  it('should override deep defaultProps', function () {
    var A1 = t.struct({ z: t.String }, { defaultProps: { z: 'default-a' } });
    var B1 = t.struct.extend([A1], { defaultProps: { z: 'override-b' } });
    var C1 = t.struct.extend([B1, {}], { defaultProps: {}});
    var D1 = t.struct.extend([C1, {}], { defaultProps: { z: 'override-d' }});
    assert.deepEqual(A1.meta.defaultProps, {
      z: 'default-a'
    });
    assert.deepEqual(B1.meta.defaultProps, {
      z: 'override-b'
    });
    assert.deepEqual(C1.meta.defaultProps, {
      z: 'override-b'
    });
    assert.deepEqual(D1.meta.defaultProps, {
      z: 'override-d'
    });
    assert.deepEqual(D1({}), {
      z: 'override-d'
    });
    assert.deepEqual(D1({ z: 'provided-d' }), {
      z: 'provided-d'
    });
  });

  describe('struct.extend(mixins, [name])', function () {

    it('should handle an array of mixins', function () {
      var Point3D = t.struct.extend([Point, { z: t.Number }], 'Point3D');
      assert.deepEqual(Point3D.meta.name, 'Point3D', 'name');
      assert.deepEqual(Point3D.meta.props.x, t.Number, 'x');
      assert.deepEqual(Point3D.meta.props.y, t.Number, 'y');
      assert.deepEqual(Point3D.meta.props.z, t.Number, 'z');
    });

  });

  describe('<Struct>.extend(mixins, [name])', function () {

    it('should extend an existing struct', function () {
      var Point3D = Point.extend({ z: t.Number }, 'Point3D');
      assert.strictEqual(Point3D.meta.name, 'Point3D', 'name');
      assert.strictEqual(Point3D.meta.props.x, t.Number, 'x');
      assert.strictEqual(Point3D.meta.props.y, t.Number, 'y');
      assert.strictEqual(Point3D.meta.props.z, t.Number, 'z');
    });

    it('should handle an array of mixins', function () {
      var Type = t.struct({ a: t.String }, 'Type');
      var Mixin = [{ b: t.Number, c: t.Boolean }];
      var NewType = Type.extend(Mixin, 'NewType');
      assert.strictEqual(t.getTypeName(NewType), 'NewType');
      assert.strictEqual(NewType.meta.props.a, t.String);
      assert.strictEqual(NewType.meta.props.b, t.Number);
      assert.strictEqual(NewType.meta.props.c, t.Boolean);
    });

    it('should handle an array of objects / structs / interfaces as mixins', function () {
      var A = t.struct({ a: t.String }, 'A');
      var B = t.struct({ b: t.String }, 'B');
      var C = t.struct({ c: t.String }, 'C');
      var MixinD = { d: t.String };
      var I = t.inter({ i: t.String }, 'I');
      I.prototype.imethod = function() {};
      var E = A.extend([B, C, MixinD, I]);
      assert.deepEqual(E.meta.props, {
        a: t.String,
        b: t.String,
        c: t.String,
        d: t.String,
        i: t.String
      });
      assert.equal(E.prototype.imethod === I.prototype.imethod, true);
    });

    it('should support prototypal inheritance', function () {
      var Rectangle = t.struct({
        w: t.Number,
        h: t.Number
      }, 'Rectangle');
      Rectangle.prototype.area = function () {
        return this.w * this.h;
      };
      var Cube = Rectangle.extend({
        l: t.Number
      });
      Cube.prototype.volume = function () {
        return this.area() * this.l;
      };

      assert(typeof Rectangle.prototype.area === 'function');
      assert(typeof Cube.prototype.area === 'function');
      assert(undefined === Rectangle.prototype.volume);
      assert(typeof Cube.prototype.volume === 'function');
      assert(Cube.prototype.constructor === Cube);

      var c = new Cube({w: 2, h: 2, l: 2});
      assert.deepEqual(c.volume(), 8);
    });

    it('should support multiple prototypal inheritance', function () {
      var A = t.struct({ a: t.Str }, 'A');
      A.prototype.amethod = function () {};
      var B = t.struct({ b: t.Str }, 'B');
      B.prototype.bmethod = function () {};
      var C = t.struct({ c: t.Str }, 'C');
      C.prototype.cmethod = function () {};
      var Z = C.extend([A, B], 'Z');
      var z = new Z({ a: 'a', b: 'b', c: 'c' });
      assert.strictEqual(Z.meta.name, 'Z');
      assert.strictEqual(t.Function.is(z.cmethod), true);
      assert.strictEqual(t.Function.is(z.bmethod), true);
      assert.strictEqual(t.Function.is(z.amethod), true);
    });

  });

  describe('interface.extend', function () {
    it('should handle an array of mixins', function () {
      var Point3DInterface = t.inter.extend([PointInterface, { z: t.Number }], 'Point3DInterface');
      assert.strictEqual(Point3DInterface.meta.name, 'Point3DInterface', 'name');
      assert.strictEqual(Point3DInterface.meta.props.x, t.Number, 'x');
      assert.strictEqual(Point3DInterface.meta.props.y, t.Number, 'y');
      assert.strictEqual(Point3DInterface.meta.props.z, t.Number, 'z');
    });
  });

  describe('<Interface>.extend(xs, [name])', function () {

    it('should extend an existing interface', function () {
      var Point3DInterface = PointInterface.extend({ z: t.Number }, 'Point3DInterface');
      assert.strictEqual(Point3DInterface.meta.name, 'Point3DInterface', 'name');
      assert.strictEqual(Point3DInterface.meta.props.x, t.Number, 'x');
      assert.strictEqual(Point3DInterface.meta.props.y, t.Number, 'y');
      assert.strictEqual(Point3DInterface.meta.props.z, t.Number, 'z');
    });

    it('should handle an array as argument', function () {
      var Mixin = [{ b: t.Number, c: t.Boolean }];
      var NewInterface = PointInterface.extend(Mixin, 'NewInterface');
      assert.strictEqual(t.getTypeName(NewInterface), 'NewInterface');
      assert.strictEqual(NewInterface.meta.props.x, t.Number);
      assert.strictEqual(NewInterface.meta.props.y, t.Number);
      assert.strictEqual(NewInterface.meta.props.b, t.Number);
      assert.strictEqual(NewInterface.meta.props.c, t.Boolean);
    });

  });

  describe('refinements', function () {

    it('should extend refinements', function () {
      var PersonContact = t.struct({
        cell: t.maybe(t.String),
        work: t.maybe(t.String)
      });

      function atLeastOne (x) {
        return Boolean(x.cell || x.work);
      }

      var PersonContactStrict = t.refinement(PersonContact, atLeastOne);

      var mixin = {
        role: t.maybe(t.String),
        department: t.maybe(t.String)
      };

      function atLeastOne$(x) {
        return Boolean(x.role || x.department);
      }

      var Role = t.struct(mixin);
      Role.prototype.getRole = function () {
        return this.role + ' ' + this.department;
      };
      var RoleStrict = t.refinement(Role, atLeastOne$);

      var CompanyContact = t.struct.extend([PersonContactStrict, mixin]);
      assert.strictEqual(CompanyContact.meta.kind, 'subtype');
      assert.strictEqual(CompanyContact.meta.predicate, atLeastOne);
      assert.strictEqual(CompanyContact.meta.type.meta.kind, 'struct');
      assert.deepEqual(Object.keys(CompanyContact.meta.type.meta.props), [
        'cell',
        'work',
        'role',
        'department'
      ]);

      CompanyContact = t.struct.extend([PersonContactStrict, t.inter(mixin)]);
      assert.strictEqual(CompanyContact.meta.kind, 'subtype');
      assert.strictEqual(CompanyContact.meta.predicate, atLeastOne);
      assert.strictEqual(CompanyContact.meta.type.meta.kind, 'struct');
      assert.deepEqual(Object.keys(CompanyContact.meta.type.meta.props), [
        'cell',
        'work',
        'role',
        'department'
      ]);

      CompanyContact = t.inter.extend([PersonContactStrict, mixin]);
      assert.strictEqual(CompanyContact.meta.kind, 'subtype');
      assert.strictEqual(CompanyContact.meta.predicate, atLeastOne);
      assert.strictEqual(CompanyContact.meta.type.meta.kind, 'interface');
      assert.deepEqual(Object.keys(CompanyContact.meta.type.meta.props), [
        'cell',
        'work',
        'role',
        'department'
      ]);

      var RolePersonContact = PersonContact.extend(RoleStrict);
      assert.strictEqual(RolePersonContact.meta.kind, 'subtype');
      assert.strictEqual(RolePersonContact.meta.predicate, atLeastOne$);
      assert.strictEqual(RolePersonContact.meta.type.meta.kind, 'struct');
      assert.deepEqual(Object.keys(RolePersonContact.meta.type.meta.props), [
        'cell',
        'work',
        'role',
        'department'
      ]);
      assert.strictEqual(RolePersonContact.prototype.getRole, Role.prototype.getRole);

    });

  });

});
