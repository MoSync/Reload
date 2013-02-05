cd server
start bin\win\node.exe node_modules\weinre\weinre --boundHost -all-
start bin\win\node.exe main.js
start http://localhost:8283
cd ..
