var io = require('socket.io-client');
var map = require('array-map');
var each = require('foreach');
var toArray = require('to-array');
var inspect = require('util-inspect');
var socket = io();

// make `console` remote
if (!global.options.k) {
  global.console = {};
  each(['log', 'info', 'warn', 'error', 'debug'], function(m){
    global.console[m] = function(){
      var args = toArray(arguments);
      socket.emit('console', m, map(args, function(a){
        return inspect(a, { colors: true });
      }));
    };
  });
}

socket.on('run', function(js, fn){
  try {
    // eval in the global scope (http://stackoverflow.com/a/5776496/376773)
    var rtn = (function() { return eval.apply(this, arguments); })(js);

    // save the previous value as `_`. matches node's main REPL behavior
    global._ = rtn;

    fn(null, inspect(rtn, { colors: true }));
  } catch(e) {
    // we have to create a "flattened" version of the `e` Error object,
    // for JSON serialization purposes
    var err = {};
    for (var i in e) err[i] = e[i];
    err.message = e.message;
    err.stack = e.stack;
    // String() is needed here apparently for IE6-8 which throw an error deep in
    // socket.io that is hard to debug through SauceLabs remotely. For some
    // reason, toString() here bypasses the bug...
    err.name = String(e.name);
    fn(err);
  }
});

window.onerror = function(message, url, linenumber){
  socket.emit('global err', message, url, linenumber);
};
