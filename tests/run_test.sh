#!/usr/bin/env bash

# We're calling intern-X.js directly here so that this script can be shared by
# master and geezer, but intern should normally be started using the links
# created by npm in node_modules/.bin.
rm -rf html-report ./lcov.info ./client_lcov.info ./runner_lcov.info ./logs
PATH=./node_modules/.bin/:$PATH
start-selenium -port 4567 &> /dev/null &
my_child_PID=$!
rand=$RANDOM
export SELENIUM_LAUNCHER_PORT=4567
intern-client config=tests/intern-selftest-client runId=$rand logDir=./logs
intern-runner config=tests/intern-selftest-runner runId=$rand logDir=./logs

# node --debug-brk ./node_modules/.bin/intern-client config=tests/intern-selftest-client runId=$rand
# export SELENIUM_LAUNCHER_PORT=4567 
# node --debug-brk ./node_modules/.bin/intern-runner config=tests/intern-selftest-runner runId=$rand logDir=./logs