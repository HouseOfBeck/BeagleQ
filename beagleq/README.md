This is the beagleq client.

Copy this entire directory into /usr/share/bone101/

Next, make sure the server is running.

then load the page in a web browser

http://your.beagle.address/beagleq/

If everything is working correctly you will see a connect message in the status pane.
Then temperatures will start appearing in the temperature pane and the gauges will 
indicate the temps. On the "chart" tab a plot will begin to appear.

The "test" tab is my play area. It will eventually go away.

The "about" tab will have the correct information for your beaglebone. The cape
eeprom data is static and not yet dynamic. It's on my list to fix.

Anyone with web frontend development skills is encouraged to help out.
In particular, I want to eliminate the google gauges in favor of something
like Highcharts so that the it can run without an internet connection.

Also, I need to add more tabs to tune the PID and manage output files.
