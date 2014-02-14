var util = require('util');

var socket = io();
socket.on('run', function(js, fn){
  try {
    var rtn = eval(js);
    fn(null, util.inspect(rtn, {
      color: true,
      colors: true
    }));
  } catch(e) {
    fn(e.stack || e.message);
  }
});
window.onerror = function(err){
  if (!err) err = 'Unknown global error on `window`.';
  if (err.stack) err = err.stack;
  io.emit('global err', err);
};
