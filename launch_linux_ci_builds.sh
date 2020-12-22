#!/bin/bash
# Hacky workaround for problems on Linux
chmod +x dont_run_directly
output="SHOULD RESTART PROGRAM"
while [[ $output == *"SHOULD RESTART PROGRAM"* ]]; do
  if test -f "resources/app/node_modules/java/build/jvm_dll_path.json"; then
    LD_LIBRARY_PATH=$(cat resources/app/node_modules/java/build/jvm_dll_path.json| sed 's/"//g' | sed 's/://g') ./dont_run_directly
    output=""
  else
    exec 3>&1
    output=$(LD_LIBRARY_PATH=$(cat resources/app/node_modules/java/build/jvm_dll_path.json| sed 's/"//g' | sed 's/://g') ./dont_run_directly 2>&1 1>&3)
    exec 3>&-
  fi
done