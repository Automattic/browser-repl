#!/usr/bin/env node

if (!process.stdout.isTTY) {
  console.error('Must run in a TTY');
  process.exit(1);
}

var wd = require('wd');
var env = process.env;
var repl = require('repl');
var args = process.argv.slice(2);
var argv = require('minimist')(args);
var sio = require('socket.io');
var lt = require('localtunnel').connect;
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
var browser = browsers[str || parts[1]];
if (!browser) return usage();
var version = parts[2];
platform = platforms[platform || browser.platform];
browser = browser.name;

// app
var app = express();
var srv = http(app);
app.use(express.static(join(__dirname, 'static')));
var io = sio(srv);
var tunnel, socket;

setup();

function setup(){
  console.log('… setting up tunnel');
  srv.listen(function(){
    tunnel = lt({
      host: 'https://localtunnel.me',
      port: srv.address().port
    });
    tunnel.on('url', function(url){
      console.log('… booting up \033[96m'
        + browser + '\033[39m (' + (version || 'latest')
        + ') on ' + platform);
      spawn(url);
    });
    // let `error` throw
  });
}

function spawn(url){
  var user = env.SAUCE_USER;
  var key = env.SAUCE_KEY;
  var vm = wd.remote('ondemand.saucelabs.com', 80, user, key);
  var opts = { browserName: browser };
  if (version) opts.version = version;
  opts.platform = platform;
  vm.init(opts, function(err){
    if (err) throw err;
    vm.get(url, function(err){
      if (err) throw err;
      // socket io `connection` should fire now
    });
    io.on('connection', function(s){
      socket = s;
      start();
    });
  });
}

function usage(){
  console.error('');
  console.error('usage: repl <browser>[version] [platform]');
  console.error('');
  console.error('examples:');
  console.error(' $ repl ie6     # ie 6');
  console.error(' $ repl chrome  # chrome latest');
  console.error('');
  console.error('browsers: ' + Object.keys(browsers).filter(function(v){
    return !/\d/.test(v);
  }).join(','));
  console.error('platforms: ' + Object.keys(platforms).join(','));
  console.error('');
  process.exit(1);
}

function start(){
  socket.on('global err', function(){
    console.log('global error');
  });
  var cmd = repl.start({
    prompt: ' \033[90mie › \033[39m',
    eval: function(cmd, ctx, file, fn){
      socket.emit('run', cmd, function(err, data){
        fn(err || data);
      });
    }
  });
  cmd.on('exit', function(){
    process.exit(0);
  });
}
