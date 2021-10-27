#!/bin/bash

DS_PATH="/Users/peterderoovere/Documents/Baekeland/Data.nosync/final_converted"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BU_PATH="${DS_PATH}_[${TIMESTAMP}]"

cd $DS_PATH
find . -name '*.json' | cpio -pdm $BU_PATH
