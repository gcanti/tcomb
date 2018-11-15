import * as t from './index'

//
// basic types
//

// * Any *
t.Any('s');
t.Any(1);
t.Any(true);

  // static members
  t.Any.displayName;

  // meta object
  t.Any.is(1);
  t.Any.meta.kind;
  t.Any.meta.name;
  t.Any.meta.identity;
  t.Any.meta.predicate;

// * Nil *
t.Nil(null);
t.Nil(undefined);

// * String *
t.String('s');

// * Number *
t.Number(1);

// * Boolean *
t.Boolean(true);
t.Boolean(false);

// * Array *
t.Array([])
t.Array([1, 2, 's'])

// * Object *
t.Object({})
t.Object({a: 1, b: 's'})

// * Function *
t.Function(() => {})

// * Error *
t.Error(new Error())

// * RegExp *
t.RegExp(/a/)

// * Date *
t.Date(new Date())

// test type guard
function testTypeGuardBuiltIn(x: string | number): string {
  if (t.String.is(x)) {
    return x;
  }
  return String(x);
}

//
// irreducible combinator
//

// * based on string *
const Url = t.irreducible<string>('Url', (s) => t.String.is(s) && s.indexOf('http') === 0);
Url('s')

  // static members
  Url.displayName;

  // meta object
  Url.meta.kind;
  Url.meta.name;
  Url.meta.identity;
  Url.meta.predicate;

  // using a tcomb type as type annotation
  function f(url: typeof Url.t) {}

// * based on Date *
const PastDate = t.irreducible<Date>('PastDate', (date) => t.Date.is(date) && date.getTime() < new Date().getTime());
PastDate(new Date(1973, 10, 30))

//
// refinement combinator
//

// * a refinement based on a basic type *
const Email = t.refinement(t.String, (s) => s.indexOf('@') !== -1);
Email('s')

  // static members
  Email.displayName;

  // meta object
  Email.meta.kind;
  Email.meta.name;
  Email.meta.identity;
  Email.meta.type;
  Email.meta.predicate;

// * a refinement based on a Class *
class A {}
const ARefinement = t.refinement<A>(A, () => true);

ARefinement(new A())

//
// interface combinator
//

const MyCoolType = t.interface(
  { isCool: t.Boolean },
  { name: 'My cool type', strict: false }
);

const MySuperCoolType = MyCoolType.extend(
  { isEvenCooler: t.Boolean },
  { name: 'My super cool type', strict: false }
);

//
// struct combinator
//

interface Person {
  name: string;
  age: number;
}

const Person = t.struct<Person>({
  name: t.String,
  age: t.Number
}, 'Person');

const person1 = new Person({ name: 'Giulio', age: 42 })
const person2 = Person({ name: 'Giulio', age: 42 })

  // static members
  Person.displayName;

  // extend function
  interface Person2 extends Person {
    surname: string;
  }
  const Person2 = Person.extend<Person2>({ surname: t.String })

  const Person2b = Person.extend<Person2>(
    { surname: t.String },
    { name: 'Person 2b', strict: false }
  )

  // update function
  const person3 = Person.update(person1, {
    name: {$set: 'Guido'}
  });

  // meta object
  Person.meta.kind;
  Person.meta.name;
  Person.meta.identity;
  Person.meta.props;

//
// list combinator
//

const Tags = t.list(t.String, 'Tags');

const list1 = Tags(['a', 'b']);

  // static members
  Tags.displayName;

  // update function
  const list2 = Tags.update(list1, {
    0: {$set: 's'}
  });

  // meta object
  Tags.meta.kind;
  Tags.meta.name;
  Tags.meta.identity;
  Tags.meta.type;

//
// dict combinator
//

const Phones = t.dict(t.String, t.Number, 'Phones');

const dict1 = Phones({a: 1, b: 2});

  // static members
  Phones.displayName;

  // update function
  const dict2 = Phones.update(dict1, {
    $remove: ['a']
  });

  // meta object
  Phones.meta.kind;
  Phones.meta.name;
  Phones.meta.identity;
  Phones.meta.domain;
  Phones.meta.codomain;

//
// enums combinator
//

const Country = t.enums({
  IT: 'Italy',
  US: 'United States'
}, 'Country');

const country = Country('IT');

  // static members
  Country.displayName;

  // meta object
  Country.meta.kind;
  Country.meta.name;
  Country.meta.identity;
  Country.meta.map;

  // of
  const Country2 = t.enums.of(['IT', 'US'], 'Country2');
  const Country3 = t.enums.of('IT US', 'Country3');

//
// maybe combinator
//

const MaybeString = t.maybe(t.String, 'MaybeString');

MaybeString('s');
MaybeString(null);
MaybeString(undefined);

  // static members
  MaybeString.displayName;

  // meta object
  MaybeString.meta.kind;
  MaybeString.meta.name;
  MaybeString.meta.identity;
  MaybeString.meta.type;

//
// tuple combinator
//

const Size = t.tuple<[number, number]>([t.Number, t.Number], 'Size');
type Size = typeof Size.t;

const size1 = Size([100, 200]);

  // static members
  Size.displayName;

  // meta object
  Size.meta.kind;
  Size.meta.name;
  Size.meta.identity;
  Size.meta.types;

  // update function
  const size2 = Size.update(size1, {
    0: { $set: 150 }
  });

//
// union combinator
//

const Union = t.union<Person | Size>([Person, Size], 'Union');
Union.dispatch = function (x) {
  return t.Array.is(x) ? Size : Person;
};

const union1 = Union({ name: 'Giulio', age: 42 });

  // static members
  Union.displayName;
  Union.dispatch({ name: 'Giulio', age: 42 });

  // meta object
  Union.meta.kind;
  Union.meta.name;
  Union.meta.identity;
  Union.meta.types;

  // update function
  const union2 = Union.update(union1, {
    name: { $set: 'Guido' }
  });

//
// union combinator
//

const Min = t.refinement(t.String, (s) => s.length > 2);
const Max = t.refinement(t.String, (s) => s.length < 5);
const MinMax = t.intersection<string>([Min, Max], 'MinMax');

const minmax1 = MinMax('s');

  // static members
  MinMax.displayName;

  // meta object
  MinMax.meta.kind;
  MinMax.meta.name;
  MinMax.meta.identity;
  MinMax.meta.types;

  // update function
  const minmax2 = MinMax.update(minmax1, { $set: 'ss' });

//
// declare combinator
//
type Tree = {
  value: number;
  left?: Tree;
  right?: Tree;
};
const Tree = t.declare<Tree>('Tree');

Tree.define(t.struct({
  value: t.Number,
  left: t.maybe(Tree),
  right: t.maybe(Tree)
}));

const bst = Tree({
  value: 5,
  left: {
    value: 2
  },
  right: {
    left: {
      value: 6
    },
    value: 7
  }
});

//
// is
//
t.is(1, t.Number);

//
// assert
//
t.assert(true, 'a message');
t.assert(true, () => 'a lazy message');

//
// fail
//
t.fail('a message');

//
// isType
//
t.isType(t.String);
t.isType(A);

//
// getTypeName
//
t.getTypeName(t.String);
t.getTypeName(A);

//
// mixin
//
t.mixin({a: 1}, {b: 2}).a;
t.mixin({a: 1}, {b: 2}).b;

//
// match
//
t.match(1,
  t.String, (s) => 'a string',
  t.Number, (n) => n > 2, (n) => 'a number gt 2', // case with a guard (optional)
  t.Number, (n) => 'a number lte 2',
  A,        (a) => 'an instance of A',
  t.Any,    (x) => 'other...' // catch all
);

//
// update
//
t.update({}, { a: { $set: 1 } });

