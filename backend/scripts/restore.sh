#!/bin/bash

BU_PATH="/Users/peterderoovere/Documents/Baekeland/Data.nosync/final_converted_[20210727144432]"
DS_PATH="/Users/peterderoovere/Documents/Baekeland/Data.nosync/final_converted"

cd $BU_PATH
find . -name '*.json' | cpio -pudm $DS_PATH
