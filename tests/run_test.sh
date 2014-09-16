#!/usr/bin/env bash

# We're calling intern-X.js directly here so that this script can be shared by
# master and geezer, but intern should normally be started using the links
# created by npm in node_modules/.bin.
rm -rf html-report
PATH=./node_modules/.bin/:$PATH
start-selenium -port 4567 &> /dev/null &
my_child_PID=$!
intern-client config=tests/intern-selftest-client
intern-runner config=tests/intern-selftest-runner