// IE <= 8 compat stuff :\
require('es5-shim');
if (!window.JSON) window.JSON = require('json3');

// XXX: not sure why `es5-shim` doesn't do this one for us :\
if (!Object.getOwnPropertyDescriptor) {
  Object.getOwnPropertyDescriptor = function (value, key) {
    return { value: value[key] };
  };
}

var util = require('util');
var socket = io();

socket.on('run', function(js, fn){
  try {
    var rtn = eval(js);
    var str = util.inspect(rtn, {
      colors: true
    });
    fn(null, str);
  } catch(e) {
    e.stack = e.stack;
    e.message = e.message;
    // String() is needed here apparently for IE6-8 which throw an error deep in
    // socket.io that is hard to debug through SauceLabs remotely. For some
    // reason, toString() here bypasses the bug...
    e.name = String(e.name);
    fn(e);
  }
});
window.onerror = function(err){
  if (!err) err = 'Unknown global error on `window`.';
  if (err.stack) err = err.stack;
  io.emit('global err', err);
};
