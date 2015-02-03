
0.3.2 / 2015-02-02
==================

 * repl: replace localtunnel with ngrok
 * package: bump socket.io and add ngrok

0.3.1 / 2015-02-02
==================

  * Makefile: ensure `static` dir is created
  * package: add "description" field
  * package: add "repository" and "license" fields
  * package: remove unused "debug" dependency
  * package: update "browserify" to v8.1.3
  * package: use npm's versions of "socket.io" and "socket.io-client"

0.3.0 / 2014-04-08
==================

  * repl: add HTML5 doctype tag
  * client, repl: use the correct window.onerror args
  * client: emit on the `socket`, not `io`
  * Readme: better gif

0.2.1 / 2014-02-17
==================

  * bump

0.2.0 / 2014-02-17
==================

  * repl: added sauce heartbeats
  * client: save the previous expression result as `_`
  * client: properly serialize the `message` and `stack`
  * repl: prepend the "name" and "message" to stack
  * repl: parse more syntax errors from more browsers
  * client, repl: better "error" handling
  * client: eval in the global scope
  * browsers: fix ie10
  * fix ie9, fix prompt, fix not specifying version
  * improve browserify build
  * client: remove redundant `color` option
  * Makefile: add a `build` rule
  * repl: don't use ansi escape codes in prompt

0.1.0 / 2014-02-13
==================

  * first release
