const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
const si = require('systeminformation');
const exec = require('child_process').exec;
var spawn = require('child_process').spawn;


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
    if (log !== newLog) {
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

var sLat = 0;
var sLon = 0;
var eLat = 0;
var eLon = 0;

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

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

    // move map ?

    //europe
    if (key == 'e') {
        sLat = 118;
        sLon = 159;
        eLat = 161;
        eLon = 241;
    }

    //zoom
    if (key == 'x') {
        sLat ++
        sLon ++
    }
    if (key == 'y') {
        sLat --
        sLon --
    }
    //move?
    if (key == 'm') {
        eLat ++
        eLon ++
    }
    if (key == 'n') {
        eLat --
        eLon --
    }
    //lon 
    if (key == 'a') {
        sLat --;
    }
    if (key == 'd') {
        sLat ++;
    }
    //lat
    if (key == 'w') {
        sLon ++;
    }
    if (key == 's') {
        sLon --;
    }
        //lon 
        if (key == 'j') {
            eLat --;
        }
        if (key == 'l') {
            eLat ++;
        }
        //lat
        if (key == 'i') {
            eLon ++;
        }
        if (key == 'k') {
            eLon --;
        }
    //log
    if (key == 'c') {
      console.log('slon: ' + sLon, 'slat: ' + sLat);
      console.log('elon: ' + eLon, 'elat: ' + eLat);  
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
    var map = grid.set(0, 0, 6, 12, contrib.map, {label: 'access log | apache', startLon: sLon, startLat: sLat, endLat: eLat, endLon: eLon});
    time ++;
    readLastLines.read('/var/log/apache2/access.log', 1).then((lines) => getlog(lines));
    log.log(String(newLog));    
    for (let i = 0; i < ipGroup.length; i++) {
        try {
            geo = geoip.lookup(ipGroup[i]).ll;
            console.log(geoip.lookup(ipGroup[i]));
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
        //console.log(cpuTemp.main);
        donut.setData([
            {percent: cpuTemp.main, label: 'cpu','color': 'green'},
            {percent: 43, label: 'test','color': 'blue'},
        ]);
    }

    getCpu();


    

    temp = spawn('cat', ['/sys/class/thermal/thermal_zone0/temp']);

    temp.stdout.on('data', function(data) {
        console.log('Result: ' + data/1000 + ' degrees Celcius');
    });

    //var box = grid.set(6, 6, 3, 6, blessed.box, {label: 'debug box', content: String(cpuTemp)});

    screen.render();
}, 800);

