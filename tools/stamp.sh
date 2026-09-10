#!/bin/sh
# Stamp css/js URLs in index.html with a short hash of their contents.
#
# The filenames are not content-hashed, so without this a browser that has
# already cached css/site.css can keep serving it against newer markup —
# which does not degrade, it breaks. Hashing the query string means changed
# content always arrives under a URL nothing has cached.
#
# Wired into vercel.json as the build command, so it runs on every deploy.
# Portable sed only: the build container is GNU, a Mac is BSD.
set -e
cd "$(dirname "$0")/.."

css=$(cksum css/site.css | awk '{print $1}')
js=$(cksum js/site.js | awk '{print $1}')

tmp=$(mktemp)
sed -E -e "s|(href=\"css/site\.css)(\?v=[0-9]+)?\"|\1?v=$css\"|" \
       -e "s|(src=\"js/site\.js)(\?v=[0-9]+)?\"|\1?v=$js\"|" \
       index.html > "$tmp"
mv "$tmp" index.html

echo "stamped css=$css js=$js"
grep -o 'css/site\.css?v=[0-9]*' index.html
grep -o 'js/site\.js?v=[0-9]*' index.html
