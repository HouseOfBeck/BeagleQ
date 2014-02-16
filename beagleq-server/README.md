My first cut at node.js server. It requires the websocket 'ws' module.

Still a bit rough around the edges but I wanted to get something out.

It has a simulator mode where it will read the input file "cook.log" to use as input
temperatures. I use this for testing the PID and other functions.

For real use run start it up first then pull up the web client.

./beagleq-server
Parsing probes.json
Found probe ... ET-73
0.0002284143823
0.0002373151289
1.249333734e-7
R8: 9960
R9: 9950
R10: 9920
R11: 9995
Server running on port: 8086

<now start client in web browser>


