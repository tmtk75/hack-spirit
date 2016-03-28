# hack-spirit

hack-spirit is a client library and cui for TeamSpirit.
It makes TeamSpirit hackable.

Currently, it provides these functionalities:

- Get current work status ()
- Start work
- Finish work

## Installation

```
$ npm install --global https://github.com/aHirokiKumamoto/hack-spirit
```


## Usage

```
  Usage: hack-spirit action [options]

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -u, --user [type]      user name
    -p, --password [type]  password
    -v, --verbose          print log
    -b, --browser          show browser

  Actions:
    work_status            print current work status
    start_work             start work
    finish_work            finish work
```

### Examples

```
$ hack-spirit work_status -u user_name -p password
```

### How it works

hack-spirit is highly depended on
[nightmare][] that uses [electron][] as headless browser.

So, you can see how the electron works with `--browser` options.


[nightmare]: https://github.com/segmentio/nightmare)
[electron]:  http://electron.atom.io/
