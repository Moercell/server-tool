const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
const si = require('systeminformation');
const exec = require('child_process').exec;

const screen = blessed.screen({
    smartCSR: true
  });

var newLog = "";
var ip;
var geo;
var ipGroup = [];
var oldLog;
var oldIps = [];

function isOdd(num) { return num % 2;}

function getlog(log) {
    //logs = log.split(/\r?\n/);
    if (log != newLog) {
        newLog = log;
        ip = newLog.split(" ")[0];
        ipGroup.push(ip);
        if (ipGroup.length > 20) {
            ipGroup.shift();
        }
    }
    
    //geo = geoip.lookup(ip).ll;
}


function oldLogs(log) {
    oldLog = log.split("\n"); 
    for (let i = 0; i < oldLog.length; i++) {
        ipGroup.push(oldLog[i].split(" ")[0]);
        
    }
}

// check "screen" size 


//update grid


//place elements



var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});
var map = grid.set(0, 0, 6, 12, contrib.map, {label: 'access log | apache'});
var log = grid.set(5, 0, 1, 12, contrib.log, { fg: "green", selectedFg: "green", label: 'access Log'});
var donut = grid.set(6, 0, 2, 6, contrib.donut, {
	label: 'temp',
	radius: 8,
	arcWidth: 3,
	remainColor: 'black',
	yPadding: 2,
	data: [
      {percent: 10, label: 'cpu', color: 'green'},
	]
  });

  // get keypress
  screen.on('keypress', function(key) {

    // exit
    if (key == "q") {
        process.exit();
    }
    if (key == "f") {
        fan = exec("fanup", function(err, stdout, stderr) {
            if (err) {
              console.log(err)
            }
            console.log(stdout);
          });
          
          fan.on('exit', function (code) {
            // exit code is code
          });
    }
  });

readLastLines.read('/var/log/apache2/access.log', 15).then((lines) => oldLogs(lines));


let time = 0;
setInterval(() => {

    time ++;
    readLastLines.read('/var/log/apache2/access.log', 1).then((lines) => getlog(lines));
    log.log(String(newLog));    
    for (let i = 0; i < ipGroup.length; i++) {
        try {
            geo = geoip.lookup(ipGroup[i]).ll;
        } catch (error) {
            //console.log(error);
        }
        
        let amount = 0;
        for (let j = 0; j < ipGroup.length; j++) {
            if (ipGroup[i] == ipGroup[j]) {
                amount ++;
            }
        }

        map.addMarker({"lon" : String(geo[1]), "lat" : String(geo[0]), color: "blue", char: String(amount) });
    }

    if (isOdd(time) ) {
        map.clearMarkers(); // make map marker blink
    }

    // get system info

    async function getCpu() {
        let cpuTemp = await si.cpuTemperature();
        var box = grid.set(6, 6, 3, 6, blessed.box, {label: 'debug box', content: String(cpuTemp)});
        //temp
        donut.setData([
            {percent: cpuTemp, label: 'cpu','color': 'green'},
            {percent: 43, label: 'test','color': 'blue'},
        ]);
    }

    getCpu();




    //var box = grid.set(6, 6, 3, 6, blessed.box, {label: 'debug box', content: String(cpuTemp)});

    screen.render();
}, 800);

