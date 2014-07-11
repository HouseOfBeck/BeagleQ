#!/usr/bin/env node

var b = require('bonescript');
var fs = require('fs');
var buffer = require('buffer');
var WebSocketServer = require('ws').Server;
var PID = require('./PID_v1.js');

SIM_MODE = 0;
DISPLAY = 0;

if (process.argv.indexOf("--sim") > -1) {
  console.log("Running in simulation mode");
  SIM_MODE = 1;
} else if (process.argv.indexOf("--display") > -1) {
  console.log("Running with external display");
  DISPLAY = 1;
}

pitTemp = 0 ;
pitSet = 225 ;
meat1Temp = 0;
meat1Set = 160;

pitAlertEnabled = 0;
pitAlert = 0;
meatAlertEnabled = 0;
meatAlert = 0;
output = 0;


var A = 0;
var B = 0;
var C = 0;

var R11 = 0; // P9_39
var R10 = 0; // P9_37
var R9 = 0; // P9_35
var R8 = 0; // P9_33

var PIT = 'P9_39';
var MEAT1 = 'P9_37';
var MEAT2 = 'P9_35';
var MEAT3 = 'P9_33';
var FAN = 'P9_16';

b.pinMode(FAN, b.OUTPUT);

var sim_temperature = [];
var i = 0;
var pidToggle = 0;

var myPID = new PID(0, 0, pitSet ,2,5,1, 0);


if (DISPLAY) {
   var d = require('./ht16k33');
   d.start();
}

function displayTemperature(temp) {
    console.log('Temperature = ',temp);

    var hundred = Math.floor(temp / 100);
    if (hundred == 0) {
         d.writeDigitRaw(0, 0x00);
    } else {
         d.writeDigit(0, hundred);
    }
    var ten = temp % 100;
    if ((Math.floor(ten/10) == 0) && (hundred == 0)) {
         d.writeDigitRaw(1, 0x00);
    } else {
         d.writeDigit(1, Math.floor(ten/10));
    }
    var one = ten % 10;
    d.writeDigit(3, Math.floor(one), 1);
    frac = Math.floor((one * 10) % 10);
    d.writeDigit(4, frac);
    d.writeDisplay();
}

function initSim() {

   fs.readFile('cook.log', function (err, logData) {
					
// If an error occurred, throwing it will
// display the exception and kill our app.
//
      if (err) throw err;

// logData is a Buffer, convert to string.

      var text = logData.toString();
 
// Break up the file into lines.
      var lines = text.split('\n');
      lines.forEach(function(line) {
         var parts = line.split(' ');
         length = sim_temperature.push(0);
         sim_temperature[length-1] = parts[1];
      });
   });
   console.log("SIM_MODE INITIALIZED");
};

function initProbes() {
   var sourceJSON = 'probes.json';
   var jsonFile = fs.readFileSync(sourceJSON, 'ascii');
   console.log('Parsing '+sourceJSON);
   var p = JSON.parse(jsonFile);

   for (var i = 0; i < p.probes.length; i++) { 
       if(p.probes[i].Model == 'ET-73') {
        console.log('Found probe ... ET-73');
        var probe = p.probes[i];

        console.log(probe.Steinhart.A);
        console.log(probe.Steinhart.B);
        console.log(probe.Steinhart.C);

        A = probe.Steinhart.A;
        B = probe.Steinhart.B;
        C = probe.Steinhart.C;
       }
   }
};

function initResistors() {
   var buf = new Buffer(128);
   eepromFile = '/sys/bus/i2c/drivers/at24/1-0054/eeprom';
   var eeprom = fs.openSync( eepromFile, 'r');
   fs.readSync(eeprom, buf, 0, 128, 244);
   fs.closeSync(eeprom);

   console.log('R8: '+buf.readUInt32LE(0));
   console.log('R9: '+buf.readUInt32LE(4));
   console.log('R10: '+buf.readUInt32LE(8));
   console.log('R11: '+buf.readUInt32LE(12));

   R8 = buf.readUInt32LE(0);
   R9 = buf.readUInt32LE(4);
   R10 = buf.readUInt32LE(8);
   R11 = buf.readUInt32LE(12);
};

function getTemperatures() {
   if (SIM_MODE && i < 2600 ) {
        pitTemp = parseFloat(sim_temperature[i]);
	i++;
   } else if (SIM_MODE && i > 2600) {
	pidToggle = 0; 
	b.analogRead(PIT, getPIT);
   } else {
	b.analogRead(PIT, getPIT);
   }
	b.analogRead(MEAT1, getMEAT1);

};

function getPIT(x) {
 if (!x.err) {

   r1 = R11/((1/x.value)-1.0);
   ktemperature = 1.0 / (A + (B * Math.log(r1)) + (C * Math.pow(Math.log(r1),3)));
   temperature = (ktemperature - 273.15) * 1.8 + 32;
//   console.log('PIT: raw: %d Resistance: %d Temp(F): %d', x.value.toFixed(3), r1.toFixed(0), temperature.toFixed(1));
   pitTemp = temperature;
 }
};

function getMEAT1(x) {
 if (!x.err) {
   r1 = R10/((1/x.value)-1.0);
   ktemperature = 1.0 / (A + (B * Math.log(r1)) + (C * Math.pow(Math.log(r1),3)));
   temperature = (ktemperature - 273.15) * 1.8 + 32;
//   console.log('MEAT-1: raw: %d Resistance: %d Temp(F): %d', x.value.toFixed(3), r1.toFixed(0), temperature.toFixed(1));
   meat1Temp = temperature;
 }
};

if (SIM_MODE) initSim();

initProbes();

initResistors();

// Instantiate WebSocket server.
var wss = new WebSocketServer({
     port: 8086
});

console.log('Server running on port: 8086');

wss.on('connection', function(ws) {

   // Send message to client that connection has been made.
   ws.send(JSON.stringify({"topic":"info", "text":"BBB WebSocket Server Connected!!!"})); 

   // Send BeagleBone Info
   b.getPlatform(sendBeagleInfo);
     function sendBeagleInfo(x) {
       console.log('name = ' + x.name);
       console.log('version = ' + x.version);
       console.log('serialNumber = ' + x.serialNumber);
       console.log('bonescript = ' + x.bonescript);

       ws.send(JSON.stringify({"topic":"beagleInfo","beagleName":x.name ,"beagleVersion":x.version,"beagleSN":x.serialNumber,"beagleBonescript":x.bonescript})); 
     }

   function checkAlerts() {
      pitEnable = pitSet * 0.90;
      pitGuard = pitSet * 0.03;
//      console.log("Alert: " + " " + pitSet + " " + pitEnable + " " + pitGuard);

      if ((pitTemp > pitEnable)&&(pitAlertEnabled != 1)) {
         console.log("Pit enabled");
         pitAlertEnabled = 1;
         ws.send(JSON.stringify({"topic":"pitAlert", "data":1})); 
      }

      if (pitAlertEnabled) {
         if (( pitTemp < (pitSet - pitGuard)) || ( pitTemp > (pitSet + pitGuard))) {
            if (pitAlert != 1) {
               console.log("Pit alert set");
	       pitAlert = 1;
               ws.send(JSON.stringify({"topic":"pitAlert", "data":2})); 
            }
         } else if (pitAlert == 1) {
	    pitAlert = 0;
            ws.send(JSON.stringify({"topic":"pitAlert", "data":1})); 
         }
      }
};

   // Handle incoming messages.
   ws.on('message', function(message) {
      obj = JSON.parse(message);
   //   console.log("parse: " + obj.topic + " " + obj.data);


      switch (obj.topic) {
         case "pidToggle":
            if (obj.data == 1 ) {
               console.log("PID On");
	       pidToggle = 1;
               ws.send(JSON.stringify({"topic":"info", "text":"PID On"}));
            } else {
               console.log("PID Off");
	       pidToggle = 0;
	       fanControl(0.0);
               ws.send(JSON.stringify({"topic":"info", "text":"PID Off"}));
            }
	    break;
         case "pitSL":
            console.log("Pit Slider: " + obj.data);
	    pitSet = obj.data;
	    myPID.SetSetPoint(pitSet);
	    break;
         case "meatSL":
            console.log("Meat Slider: " + obj.data);
	    meat1Set = obj.data;
	    break;
         default:
	    console.log("No action: " + obj.topic + " " + obj.data);
      }
   });


   var interval = setInterval(function() {
     getTemperatures();
     checkAlerts();
     if (pidToggle) {
        output = myPID.Compute(pitTemp);
        fanControl(output);
     }
     if (DISPLAY) {
       displayTemperature(pitTemp);
     }
     lastJSON = JSON.stringify({"topic":"temperatures","created_at":(new Date()),"pitSet":pitSet.toFixed(0),"pitTemp":pitTemp.toFixed(2),"meat1Set":meat1Set.toFixed(0),"meat1Temp":meat1Temp.toFixed(2),"fanSpeed":output.toFixed(2)});
     console.log(lastJSON);

//     var outputFilename = '/usr/share/bone101/beagleq/last.json';
//     fs.writeFile(outputFilename, lastJSON, function(err) {
//	  if(err) console.log(err);
//     }); 
     if (ws.readyState = ws.OPEN) ws.send(lastJSON);
   }, 4000);

   ws.on('error', function() {
	   console.log('error');
   });
   // When connection closes.
   ws.on('close', function() {
	   ws.terminate();
	   clearInterval(interval);
      console.log('stopping client interval');
   });

   function fanControl(speed) {
     if (speed > 0.5) {
        b.analogWrite(FAN,output,2900);
        ws.send(JSON.stringify({"topic":"fanStatus", "state":"1"}));
     } else {
        b.analogWrite(FAN,0,2900);
        ws.send(JSON.stringify({"topic":"fanStatus", "state":"0"}));
     }
   };
});
