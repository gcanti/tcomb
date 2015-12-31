import * as t from 'tcomb'

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

//
// irreducible combinator
//

// * based on string *
const Url = t.irreducible<string>('Url', (s) => s.indexOf('http') === 0);
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
const PastDate = t.irreducible<Date>('PastDate', (date) => date.getTime() < new Date().getTime());
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
// struct combinator
//

interface Person {
  name: string;
  age: number;
}
const Person = t.struct<Person>({
  name: t.String,
  age: t.Number
});

const p1 = new Person({ name: 'Giulio', age: 42 })
const p2 = Person({ name: 'Giulio', age: 42 })

  // static members
  Person.displayName;

  // extend function
  interface Person2 extends Person {
    surname: string;
  }
  const Person2 = Person.extend<Person2>({ surname: t.String })

  // update function
  const p3 = Person.update(p1, {
    name: {$set: 'Guido'}
  });

  // meta object
  Person.meta.kind;
  Person.meta.name;
  Person.meta.identity;
  Person.meta.props;

