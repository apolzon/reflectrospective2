#!/bin/bash

ROOT_DIR='/var/www/carbonite'
NODE_SCRIPT='server.js'

cd $ROOT_DIR
git pull

if [ ! -d log ]; then 
  mkdir log
fi

npm install

pkill -f 'node $NODE_SCRIPT'
NODE_ENV=production PORT=80 nohup node $NODE_SCRIPT >> log/node.log &
