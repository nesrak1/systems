@echo off
echo compressing...
java -jar ccnew.jar --compilation_level ADVANCED_OPTIMIZATIONS --language_in="ECMASCRIPT_2017" --language_out="ECMASCRIPT_2017" --js engine_small.js --js_output_file ee.js
pause
kzip eekz ee.js
advzip eeaz.zip -i 10 -4 -a ee.js