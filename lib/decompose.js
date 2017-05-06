const isType = require('./isType');

const isRefinement = (type) =>
  isType(type) && type.meta.kind === 'subtype';

const getPredicates = (type) =>
  isRefinement(type) ?
    [type.meta.predicate].concat(getPredicates(type.meta.type)) :
    [];

const getUnrefinedType = (type) =>
  isRefinement(type) ?
    getUnrefinedType(type.meta.type) :
    type;

const decompose = (type) =>
  ({
    predicates: getPredicates(type),
    unrefinedType: getUnrefinedType(type)
  });

module.exports = decompose;