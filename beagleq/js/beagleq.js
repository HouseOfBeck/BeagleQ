function drawChart() {
  var data = google.visualization.arrayToDataTable([
    ['Time', 'Pit Set', 'Pit', 'Meat Set', 'Meat'],
    [1,  225, 200, 180,  80],
    [2,  225, 210, 180, 100]
  ]);
//
//  var data = google.visualization.DataTable();
//  data.addColumn('number', 'Time');
//  data.addColumn('number', 'Pit Set');
//  data.addColumn('number', 'Pit');
//  data.addColumn('number', 'Meat Set');
//  data.addColumn('number', 'Meat');

  var options = {
    title: 'Temperature Time Series',
    vAxis: {
      title: 'Temperature',
      minValue: 0,
      maxValue: 300
    }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
  chart.draw(data, options);

  // When the orgchart is selected, update the table chart.
//  google.visualization.events.addListener(chart, 'ready', function() {

     count = 3
       setInterval(function() {
          var pitData = parseInt(document.getElementById('pitTemp').innerHTML);
          var psData = parseInt(document.getElementById('pitSet').innerHTML);
          var meatData = parseInt(document.getElementById('meat1Temp').innerHTML);
          var msData = parseInt(document.getElementById('meat1Set').innerHTML);
          if (pitData > 0) {
              count++
	      data.addRow([count, psData, pitData, msData, meatData]);
              chart.draw(data, options);
          }
       }, 5000);
//  });
}

function drawGauge() {

   var data = google.visualization.arrayToDataTable([
     ['Label', 'Value'],
     ['Pit', 80],
     ['Meat1', 68]
    ]);

    var options = {
      width: 400, height: 120,
      min: 100, max: 300,
      redFrom: 230, redTo: 300,
      yellowFrom:210, yellowTo: 230,
      minorTicks: 5
    };

    var gauge = new google.visualization.Gauge(document.getElementById('gauge_div'));

    gauge.draw(data, options);

    setInterval(function() {
       var pitData = parseInt(document.getElementById('pitTemp').innerHTML);
       var meatData = parseInt(document.getElementById('meat1Temp').innerHTML);
       if (pitData > 0) {
           data.setValue(0, 1, pitData);
           data.setValue(1, 1, meatData);
           gauge.draw(data, options);
       }
    }, 5000);
}

function readyFN() {
	   var host = '192.168.1.19';
	   var port = '8086';

	   var ws = new WebSocket('ws://' + host + ':' + port);

	   // PID On button click.
	   $( "#pidOn" ).click(function( event ) {
	      ws.send(JSON.stringify({"topic":"pidToggle", "data":"1"}));
	   });

	   // PID Off button click.
	   $( "#pidOff" ).click(function( event ) {
	      ws.send(JSON.stringify({"topic":"pidToggle", "data":"0"}));
	   });

	   $('.slider').slider({tooltip: 'always'});

           // Setup listener for slider events.
	   $('#pitSL').slider().on('slideStop', function (event) {

	      document.getElementById('pitSet').innerHTML = event.value;
           // Send the value over the WS connection.
	       if (ws.readyState === 1) {
	           ws.send(JSON.stringify({"topic":"pitSL", "data":event.value}));
		}
	   });

           // Setup listener for slider events.
	   $('#meatSL').slider().on('slideStop', function (event) {

	      document.getElementById('meat1Set').innerHTML = event.value;
           // Send the value over the WS connection.
	       if (ws.readyState === 1) {
	           ws.send(JSON.stringify({"topic":"meatSL", "data":event.value}));
		}
	   });

	   function updateTemps(temperature) {
	      document.getElementById('pitSet').innerHTML = temperature.pitSet;
	      document.getElementById('pitTemp').innerHTML = temperature.pitTemp;
	      document.getElementById('meat1Set').innerHTML = temperature.meat1Set;
	      document.getElementById('meat1Temp').innerHTML = temperature.meat1Temp;
	   }

	   function updateInfo(message) {
	      document.getElementById('iInfo').innerHTML = message.text;
	   }

	   function updateBeagleInfo(message) {
	      document.getElementById('beagleName').innerHTML = message.beagleName;
	      document.getElementById('beagleVersion').innerHTML = message.beagleVersion;
	      document.getElementById('beagleSN').innerHTML = message.beagleSN;
	      document.getElementById('beagleBonescript').innerHTML = message.beagleBonescript;
           }

	   function updateFanInfo(message) {
	      if ( message.state == "1" ) {
	         $("#fan").removeClass("btn-danger").addClass("btn-success");
              } else {
	         $("#fan").removeClass("btn-success").addClass("btn-danger");
              }
	   }

	   function updatePitAlert(message) {
	      if ( message.data == "1" ) {
	         $("#pitAlertPanel").removeClass("alert-info").removeClass("alert-danger").addClass("alert-success");
	         $("#piezo").removeClass("enable").addClass("disabled");
              } else if (message.data == "2" ) {
	         $("#pitAlertPanel").removeClass("alert-success").removeClass("alert-info").addClass("alert-danger");
	         $("#piezo").removeClass("disabled").addClass("enable");
              } else {
	         $("#pitAlertPanel").removeClass("alert-danger").removeClass("alert-info").addClass("alert-success");
              }
	   }

	   ws.onmessage = function (event) {
	      var incoming = JSON.parse(event.data);
	      document.getElementById('iStatus').innerHTML = incoming.topic;
	      switch (incoming.topic) {
                 case "info":
	             updateInfo(incoming);
                     break;
                 case "temperatures":
	             updateTemps(incoming);
                     break;
                 case "beagleInfo":
	             updateBeagleInfo(incoming);
                     break;
                 case "fanStatus":
	             updateFanInfo(incoming);
                     break;
                 case "pitAlert":
	             updatePitAlert(incoming);
                     break;
                 default:
	             document.getElementById('iInfo').innerHTML = "Unknown incoming message" + incoming.topic;
              }
	   };
}
