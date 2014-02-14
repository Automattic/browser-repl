var io = require('socket.io-client');
var inspect = require('util-inspect');

var socket = io();
socket.on('run', function(js, fn){
  try {
    // eval in the global scope (http://stackoverflow.com/a/5776496/376773)
    var rtn = (function() { return eval.apply(this, arguments); })(js);
    fn(null, inspect(rtn, { colors: true }));
  } catch(e) {
    fn(e.stack || e.message);
  }
});

window.onerror = function(err){
  if (!err) err = 'Unknown global error on `window`.';
  if (err.stack) err = err.stack;
  io.emit('global err', err);
};
