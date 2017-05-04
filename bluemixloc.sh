#!/bin/bash

cf target -o rrsingh@us.ibm.com -s dev
cf push -f manifest-raj.yml

