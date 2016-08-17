function assign(x, y) {
  for (var k in y) {
    x[k] = y[k];
  }
  return x;
}

module.exports = assign;