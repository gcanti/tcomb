//
// array utils (deprecated)
//

function isValidIndex(index, from, to) {
  return Num.is(index) && index >= from && index <= to;
}

function append(arr, element) {
  assert(Arr.is(arr), 'append(): bad array');
  var ret = arr.slice();
  ret.push(element);
  return ret;
}

function prepend(arr, element) {
  assert(Arr.is(arr), 'prepend(): bad array');
  var ret = arr.slice();
  ret.unshift(element);
  return ret;
}

function update(arr, index, element) {
  assert(Arr.is(arr), 'update(): bad array');
  assert(isValidIndex(index, 0, arr.length - 1), 'update(): bad index');
  var ret = arr.slice();
  ret[index] = element;
  return ret;
}

function remove(arr, index) {
  assert(Arr.is(arr), 'remove(): bad array');
  assert(isValidIndex(index, 0, arr.length - 1), 'remove(): bad index');
  var ret = arr.slice();
  ret.splice(index, 1);
  return ret;
}

function move(arr, from, to) {
  assert(Arr.is(arr), 'move(): bad array');
  assert(isValidIndex(from, 0, arr.length - 1), 'move(): bad from');
  assert(isValidIndex(to, 0, arr.length - 1), 'move(): bad to');
  var ret = arr.slice();
  if (from === to) {
    return ret;
  }
  var element = ret.splice(from, 1)[0];
  ret.splice(to, 0, element);
  return ret;
}

