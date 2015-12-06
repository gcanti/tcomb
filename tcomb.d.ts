declare module tcomb {

  type Predicate = (x: any) => boolean;

  interface Type<T> {
    (value: T): T;
    is: Predicate;
    displayName: string;
    meta: {
      kind: string,
      name: string,
      identity: boolean
    };
    t: T;
  }

  type Constructor<T> = Type<T> | Function;

  type Update<T> = (instance: T, spec: Object) => T;  // FIXME spec typing

  //
  // basic types
  //

  export var Any: Type<any>;
  export var Nil: Type<void>;
  export var String: Type<string>;
  export var Number: Type<number>;
  export var Boolean: Type<boolean>;
  export var Array: Type<Array<any>>;
  export var Object: Type<Object>;
  export var Function: Type<Function>;
  export var Error: Type<Error>;
  export var RegExp: Type<RegExp>;
  export var Date: Type<Date>;

  //
  // combinators
  //

  // irreducible

  interface Irreducible<T> extends Type<T> {
    meta: {
      kind: string,
      name: string,
      identity: boolean
    };
  }

  export function irreducible<T>(name: string, predicate: Predicate): Irreducible<T>;

  // refinement

  interface Refinement<T> extends Type<T> {
    meta: {
      kind: string,
      name: string,
      identity: boolean,
      type: T,
      predicate: Predicate
    };
    update: Update<T>;
  }

  export function refinement<T>(type: Type<T>, predicate: Predicate, name?: string): Refinement<T>;

  // struct

  type Props = {[key: string]: Constructor<any>};
  type Mixin = Props | Struct<any>;

  interface Struct<T> extends Type<T> {
    new (value: T): T;
    meta: {
      kind: string,
      name: string,
      identity: boolean,
      props: Props
    };
    update: Update<T>;
    extend<E extends T>(mixins: Mixin | Array<Mixin>, name?: string): Struct<E>;
  }

  export function struct<T>(props: Props, name?: string): Struct<T>;

  // list

  interface List<T> extends Type<Array<T>> {
    meta: {
      kind: string,
      name: string,
      identity: boolean,
      type: Constructor<T>
    };
    update: Update<Array<T>>;
  }

  export function list<T>(type: Constructor<T>, name?: string): List<T>;

  //
  // functions
  //

  export function is(x: any, type: Function): boolean;
  export function assert(guard: boolean, message?: string): void;
  export var update: Update<Object>;
}

declare module "tcomb" {
  export = tcomb
}