har-replay
==========

A small, basic tool to replay requests from multiple HTTP Archive (HAR) files for testing purposes.

Installation
============

```
git clone https://github.com/AnimationMentor/har-replay  
cd har-replay  
npm update  
./main.js -f <filename.har>  
```

Usage
=====

```
Usage: main.js [options]  
  
Options:  
  
-h, --help             Output usage information  
-s, --site <site>      Only fire requests that are for this domain (ignore everything else)  
-f, --files <glob>     A glob pattern of paths to HAR files to replay  
-q, --quiet            Do not display any http errors  
-d, --delaymax <secs>  Max number of seconds to delay before starting each script run. Default:0
```

Example
=======
```
./main.js -f "~/SIS_troubleshooting_HAR_files/QA-01-*.har" -s registration-qa41.animationmentor.com -q -d 10
```
