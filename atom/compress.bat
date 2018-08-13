@echo off
echo compressing...
java -jar ccnew.jar --compilation_level ADVANCED_OPTIMIZATIONS --language_in="ECMASCRIPT6" --language_out="ECMASCRIPT6" --js engine_small.js --js_output_file ee.js
advzip ee.zip -i 10 -4 -a ee.js