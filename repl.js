#!/usr/bin/env node

if (!process.stdout.isTTY) {
  console.error('Must run in a TTY');
  process.exit(1);
}

if (!process.env.SAUCE_ACCESS_KEY || !process.env.SAUCE_USERNAME) {
  console.error('Please configure $SAUCE_ACCESS_KEY and $SAUCE_USERNAME in your shell');
  console.error('Sign up at saucelabs.com');
  process.exit(1);
}

var wd = require('wd');
var env = process.env;
var repl = require('repl');
var args = process.argv.slice(2);
var argv = require('minimist')(args);
var sio = require('socket.io');
var ngrok = require('ngrok').connect;
var join = require('path').join;
var http = require('http').Server;
var express = require('express');

// config
var config = require('./browsers');
var browsers = config.browsers;
var platforms = config.platforms;

// parse args
var platform;
if (2 == argv._.length) platform = argv._.pop();
var str = argv._.join('');
var parts = str.match(/([a-z]+) *(\d+)?/);
if (!parts) return usage();
var browser = browsers[str] || browsers[parts[1]];
if (!browser) return usage();
var version = parts[2];
platform = platforms[platform || browser.platform];
browser = browser.name;

// app
var app = express();
var srv = http(app);
app.get('/', function(req, res){
  res.send([
    '<!DOCTYPE html>',
    '<script>options = ' + JSON.stringify(argv) + ';</script>',
    '<script src="/build.js"></script>'
  ].join('\n'));
});
app.use(express.static(join(__dirname, 'static')));

var io = sio(srv);
var socket;

setup();

function setup(){
  console.log('… setting up tunnel');
  srv.listen(function(){
    ngrok(srv.address().port, function(err, url){
      if (err) {
        console.error('… error setting up reverse tunnel');
        console.error(err.stack);
        return;
      }

      console.log('… booting up \u001b[96m'
        + browser + '\u001b[39m (' + (version || 'latest')
        + ') on ' + platform);
      spawn(url);
    });
    // let `error` throw
  });
}

function spawn(url){
  var user = env.SAUCE_USERNAME;
  var key = env.SAUCE_ACCESS_KEY;
  var vm = wd.remote('ondemand.saucelabs.com', 80, user, key);
  var opts = { browserName: browser };
  if (version) opts.version = version;
  opts.platform = platform;

  vm.init(opts, function(err){
    if (err) throw err;
    vm.get(url, function(err){
      if (err) throw err;

      // set up a heartbeat to keep session alive
      setInterval(function(){
        vm.eval('', function(err){
          if (err) throw err;
        });
      }, 30000);

      // socket io `connection` should fire now
    });
  });

  io.on('connection', function(s){
    socket = s;
    socket.on('disconnect', function(){
      console.log('socket disconnected');
      process.exit(1);
    });
    start();
  });
}

function usage(){
  console.error('');
  console.error('usage: repl <browser>[version] [platform]');
  console.error('');
  console.error('options:');
  console.error(' -h: this message');
  console.error(' -k: no remote `console` override');
  console.error('');
  console.error('examples:');
  console.error(' $ repl ie6     # ie 6');
  console.error(' $ repl chrome  # chrome latest');
  console.error('');
  console.error('available browsers: ');

  var browsernames = {};
  Object.keys(browsers).map(function(k){ return browsers[k] }).forEach(function(k){ browsernames[k.name] = true; });

  Object.keys(browsernames).forEach(function(name){
      console.error(
        ' ' + name + ':   ',
        Object.keys(browsers).filter(function(val){ return browsers[val].name == name }).join('  ')
      );
  });

  console.error('\navailable platforms: \n  ' + Object.keys(platforms).join('  '));
  console.error('');
  process.exit(1);
}

function start(){
  console.log('… ready!');
  var isAnsiReadlineOK = 'stripVTControlCharacters' in require('readline');

  var cmd = repl.start({
    prompt: isAnsiReadlineOK ? '\u001b[96m' + str + ' › \u001b[39m' : str + ' › ',
    eval: function(cmd, ctx, file, fn){
      socket.emit('run', cmd, function(err, data){
        if (err) {
          // we have to create a synthetic SyntaxError if one occurred in the
          // browser because the REPL special-cases that error
          // to display the "more" prompt
          if (
            // most browsers set the `name` to "SyntaxError"
            ('SyntaxError' == err.name &&
              // firefox
              ('syntax error' == err.message ||
               'function statement requires a name' == err.message ||
              // iOS
               'Parse error' == err.message ||
              // opera
               /syntax error$/.test(err.message) ||
               /expected (.*), got (.*)$/.test(err.message) ||
              // safari
               /^Unexpected token (.*)$/.test(err.message)
              )
            ) ||
            // old IE doens't even have a "name" property :\
            ('Syntax error' == err.message || /^expected /i.test(err.message))
          ) {
            err = new SyntaxError('Unexpected end of input');
          } else {
            // any other `err` needs to be converted to an `Error` object
            // with the given `err`s properties copied over
            var e = new Error();

            // force an empty stack trace on the server-side... in the case where
            // the client-side didn't send us a `stack` property (old IE, safari),
            // it's confusing to see a server-side stack trace.
            e.stack = '';

            for (var i in err) {
              e[i] = err[i];
            }

            // firefox and opera, in particular, doesn't include the "name"
            // or "message" in the stack trace
            var prefix = e.name;
            if (e.message) prefix += ': ' + e.message;
            if (e.stack.substring(0, prefix.length) != prefix) {
              e.stack = prefix + '\n' + e.stack;
            }

            err = e;
          }
        }
        // We're intentionally passing the successful "data" response as the
        // `err` argument to the eval function. This is because the `data` is
        // actually a properly formatted String output from `util.inspect()` run
        // on the client-side, with proper coloring, etc. coincidentally, if we
        // pass that as the `err` argument then node's `repl` module will simply
        // console.log() the formatted string for us, which is what we want
        fn(err || data);
      });
    }
  });

  socket.on('global err', function(message, url, linenumber){
    console.log('Global error: ', message, url, linenumber);
  });

  socket.on('console', function(method, args){
    console[method].apply(console, args);
  });

  cmd.on('exit', function(){
    process.exit(0);
  });
}
