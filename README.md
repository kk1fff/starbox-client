# StarBox

## Introduction

I like the `box' services, which we can put something into a folder, and
the file we put are magically transferred to another computers that we
logged in with that same account.

But, I am worry about if someday we lost such service. The economy is bad,
you know. So I decide to build a server, which everyone who got a host
can host a box service.

## Design

The client program is __starbox__, this program run as a daemon, to monitor
if user changed the box folder. To start the daemon, just type:

    $ starbox

This will block the console.

To get more information about starbox daemon, we can use another command to
get the status:

    $ starbox --filelist

will show all the file that is currently monitored.

