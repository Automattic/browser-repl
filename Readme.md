
# browser-repl

  CLI utility to set up a remote browser repl.

  ![](https://i.cloudup.com/uUo8iSbKXRh/0TXPpb.gif)

## How to use

```js
$ npm install -g browser-repl
$ export SAUCE_USERNAME="your username"
$ export SAUCE_ACCESS_KEY="your key"
$ repl ie6
```

## How it works

  `browser-repl` is built on top of the `wd` module, which is an
  implementation of the webdriver protocol.

  Once a browser session is established,
  [socket.io](http://github.com/learnboost/socket.io) is used to establish
  a persistent connection that works on all browsers as fast as possible.

  The socket.io server is hosted locally, and a reverse tunnel is set up
  with [localtunnel](https://github.com/defunctzombie/localtunnel)
  which gives your computer a temporary URL of the format
  `https://{uid}.localtunnel.me`.

  The lines you enter are subsequently `eval`d.
  A global `window.onerror` hook is also set to capture errors.
  Summoning `repl` with the `-n` argument disables this.

## License

  MIT - Copyright © 2014 Automattic, Inc.
