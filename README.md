# hack-spirit

[![Build Status](https://travis-ci.org/aHirokiKumamoto/hack-spirit.svg?branch=travis)](https://travis-ci.org/aHirokiKumamoto/hack-spirit)

<img height="260" src="logo.png">

hack-spirit is a client library and a cli for TeamSpirit.
It makes TeamSpirit hackable.

Currently, it provides these functionalities:

- Get current work status
- Start work
- Finish work
- Report your overtime work
- Report your delayed arrival
- Record worktime
- Chill out
- Generate worktime report (weekly, monthly, specified period)

## Installation

```
$ npm install --global https://github.com/aHirokiKumamoto/hack-spirit
```


## Usage

I strongly recommend `login` command that stores your credentials.
You don't need to put the options `--user` and `--password` when once you login.

```
  Usage: hack-spirit [options] [command]


  Commands:

    login                   login with your team sprint credentials
    work_status             print current work status
    start_work              start work
    finish_work             finish_work
    overtime [options]      Report your overtime work
    delayed [options]       Report your delayed arrival
    worktime [options]      Record worktime
    chill_out [options]     Chill out
    chilled_out [options]   Chilled out until the time
    chills [options]        Manage a chills
    weekly [options]        Generate weekly worktime report
    monthly [options]       Generate weekly worktime report
    time_report [options]   Generate worktime report with a specified period

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -u, --user [String]      user name
    -p, --password [String]  password
    -v, --verbose            print log
    -b, --browser            show browser
```


Some command (such as `overtime` ) takes extra options.
Please run `hack-spirit [command]  --help` and check out the output


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
