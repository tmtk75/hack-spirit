# hack-spirit

hack-spirit is a client library and cui for TeamSpirit.
It makes TeamSpirit hackable.

Currently, it provides these functionalities:

- Get current work status ()


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

  Actions:
    work_status            print current work status
```

### Examples

```
$ hack-spirit work_status -u user_name -p password
```
