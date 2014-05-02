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
  
-h, --help         output usage information  
-s, --site <site>  only fire requests that are for this domain (ignore everything else)  
-f, --files <glob>  A glob pattern of paths to HAR files to replay  
```

Example
=======
```
./main.js -f "~/SIS_troubleshooting_HAR_files/QA-01-*.har" -s registration-qa41.animationmentor.com
```
