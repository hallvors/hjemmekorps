mkdir -p static/js/web-audio-recorder/lib-minified
cp -f -v node_modules/web-audio-recorder-js/lib-minified/* static/js/web-audio-recorder/lib-minified

mkdir -p static/js/alphatab
cp -f -v -r node_modules/@coderline/alphatab/dist/* static/js/alphatab/

mkdir -p sanity/hjemmekorps-settings
echo "export default " > sanity/hjemmekorps-settings/instruments.js
cat src/config/instruments.json >> sanity/hjemmekorps-settings/instruments.js