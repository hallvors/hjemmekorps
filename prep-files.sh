# This file runs when the Docker image is built
# The problem it solves: some of these scripts use web workers,
# and need a predictable path that can be used as a SCRIPT src
# ..however, we'd rather keep them auto-updated from npm
# than checking them in to our own Git repository
# (updates may hurt of course - famous last words etc)
# So we get the module from npm, and this shell script
# copies files to the places we need them to be in..

mkdir -p static/js/web-audio-recorder/lib-minified
cp -f -v node_modules/web-audio-recorder-js/lib-minified/* static/js/web-audio-recorder/lib-minified

#mkdir -p static/js/alphatab
#cp -f -v -r node_modules/@coderline/alphatab/dist/* static/js/alphatab/

mkdir -p static/js/opensheetmusicdisplay
cp -f -v -r node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js static/js/opensheetmusicdisplay/opensheetmusicdisplay.min.js

mkdir -p sanity/hjemmekorps-settings
echo "export default " > sanity/hjemmekorps-settings/instruments.js
cat src/config/instruments.json >> sanity/hjemmekorps-settings/instruments.js