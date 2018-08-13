@echo off
echo compressing...
java -jar ccnew.jar --compilation_level ADVANCED_OPTIMIZATIONS --language_in="ECMASCRIPT5" --js test1.js --js_output_file a.js
advzip a.zip -i 10 -4 -a a.js
del a.js