#!/bin/bash
# FILES=/Users/rajrsingh/workspace/crimeharvest/uk/data/2016-05/*.csv
FILES=./data/2016-06/*.csv
export COUCH_URL=https://opendata:NVFH8ReUf9cnz@opendata.cloudant.com
export COUCH_TRANSFORM='/Users/rajrsingh/workspace/crimeharvest/uk/uk-transform.js'
export COUCH_DATABASE='crimes'
export COUCH_DELIMITER=','

for f in $FILES
do
  echo "Processing $f file..."
  # take action on each file. $f store current file name
  cat $f | couchimport 
done