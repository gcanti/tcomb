import * as t from '../.'

interface TypedFunction extends Function {
  displayName: string;
  instrumentation: {
    codomain: t.Type<any>;
    domain: Array<t.Type<any>>;
    f: Function;
  };
}

declare function isSubsetOf(subset: t.Type<any> | TypedFunction, type: t.Type<any> | TypedFunction): boolean;

export default isSubsetOf
