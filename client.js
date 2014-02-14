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
    fn(e.stack || e.message);
  }
});
window.onerror = function(err){
  if (!err) err = 'Unknown global error on `window`.';
  if (err.stack) err = err.stack;
  io.emit('global err', err);
};
