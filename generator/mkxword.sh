#!/bin/bash
#export PYTHONPATH="$PYTHONPATH:/kunden/homepages/8/d240305368/htdocs/.local/lib/python2.4/site-packages"
#python /home/adam/src/crosswords.py /home/adam/src/$1.mask /home/adam/src/wordz
#( python /home/adam/cwsolv.py $1 ) & sleep 3 ; kill !$
python `dirname $0`/minionsolve.py $1 $2 $3

