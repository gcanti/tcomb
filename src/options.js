//
// options
//

var failed = false;

function onFail(message) {
  // start debugger only once
  if (!failed) {
    /*jshint debug: true*/
    debugger; 
  }
  failed = true;
  throw new Error(message);
}

var options = {
  onFail: onFail,
  update: null
};