const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
//const si = require('systeminformation');



const screen = blessed.screen({
    smartCSR: true
  });


var newLog = "";
var ip;
var geo;
var ipGroup = [];
var oldLog;
var oldIps = [];
var map;
var log;


var sLat = 0;
var sLon = 0;
var eLat = 180;
var eLon = 360;



function getlog(log) {
    if (log !== newLog) {
        newLog = log;
        ip = newLog.split(" ")[0];
        ipGroup.push(ip);
        if (ipGroup.length > 20) {
            ipGroup.shift();
        }
    }
}


function oldLogs(log) {
    oldLog = log.split("\n"); 
    for (let i = 0; i < oldLog.length; i++) {
        ipGroup.push(oldLog[i].split(" ")[0]);
        
    }
}


function drawMap() {
    map = grid.set(0, 0, 6, 12, contrib.map, {label: 'access log | apache', startLon: sLon, startLat: sLat, endLat: eLat, endLon: eLon});
    return map
}
function drawLog() {
    log = grid.set(5, 0, 1, 12, contrib.log, { fg: "green", selectedFg: "green", label: 'access Log'});
    return log
}

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

drawMap();
drawLog();

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
    switch (key) {
        case 'q':
            process.exit();
            break;
        case 'e':
            sLat = 110;
            sLon = 144;
            eLat = 161;
            eLon = 246;
            break
        case 'r':
            sLat = 0;
            sLon = 0;
            eLat = 180;
            eLon = 360;
            break
        case 'd':
            sLon ++;
            eLon ++;
            break
        case 's':
            sLat --;
            eLat --;
            break
        case 'a':
            sLon --;
            eLon --;
            break
        case 'w':
            sLat ++;
            eLat ++;
            break
        case 'x':
            sLat ++
            sLon += 2
            break
        case 'y':
            sLat --
            sLon -= 2
            break
        case 'c':
            console.log('slon: ' + sLon, 'slat: ' + sLat);
            console.log('elon: ' + eLon, 'elat: ' + eLat);
        default:
            break;
    }

    drawMap();
    drawLog();
  });

readLastLines.read('/var/log/apache2/access.log', 15).then((lines) => oldLogs(lines));

function isOdd(num) { return num % 2;}
let time = 0;
setInterval(() => {
    time ++;
    if (time > 10) {
        time = 0;
    }
    readLastLines.read('/var/log/apache2/access.log', 1).then((lines) => getlog(lines));
    log.log(String(newLog));    
    for (let i = 0; i < ipGroup.length; i++) {
        try {
            geo = geoip.lookup(ipGroup[i]).ll;
            //console.log(geoip.lookup(ipGroup[i]));
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

   // getCpu();

    screen.render();
}, 800);

