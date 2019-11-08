const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
const si = require('systeminformation');



const screen = blessed.screen({
    smartCSR: true
  });

const tWidth = process.stdout.columns;
const tHeight = process.stdout.rows;

var newLog = "";
var ip;
var geo;
var ipGroup = [];
var oldLog;
var oldIps = [];
var map;
var log;
var colors = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow'];

var sLat = 0;
var sLon = 0;
var eLat = 180;
var eLon = 360;



function getlog(log) {
    if (log !== newLog) {
        newLog = log;
        ip = newLog.split(" ")[0];
        ipGroup.push(ip);
        if (ipGroup.length > 30) {
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


function drawMap(w, h, y, x) {
    if (w === undefined) {
        map = grid.set(0, 0, 6, 12, contrib.map, {label: 'access log | apache', startLon: sLon, startLat: sLat, endLat: eLat, endLon: eLon});
    } else {
        map = grid.set(y, x, h, w, contrib.map, {label: 'access log | apache', startLon: sLon, startLat: sLat, endLat: eLat, endLon: eLon});
    }
    return map
}
function drawLog(w, h, y, x) {
    if (w === undefined) {
        log = grid.set(5, 0, 2, 12, contrib.log, { fg: "green", selectedFg: "green", label: 'access Log'});
    } else {
        log = grid.set(y, x, h, w, contrib.log, { fg: "green", selectedFg: "green", label: 'access Log'});
    }
    return log
}


// check for screen
switch (tWidth, tHeight) {
    case 48, 21:
        var grid = new contrib.grid({rows: 9, cols: 12, screen: screen});
        drawMap(12, 6, 0, 0);
        drawLog(12, 2, 5, 0);
        break;
    case 160, 63:
        var grid = new contrib.grid({rows: 9, cols: 12, screen: screen});
        drawMap(12, 6, 0, 0);
        drawLog(12, 2, 5, 0);
        break;

    default:
        var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});
        drawMap(12, 6, 0, 0);
        drawLog(12, 2, 5, 0);
        break;
}


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
            sLat ++;
            sLon += 2;
            break
        case 'y':
            sLat --;
            sLon -= 2;
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

readLastLines.read('/var/log/apache2/access.log', 25).then((lines) => oldLogs(lines));

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
        if (amount >= 6) {
            map.addMarker({"lon" : String(geo[1]), "lat" : String(geo[0]), color: "red", char: String(amount) });
        }
        else{
            map.addMarker({"lon" : String(geo[1]), "lat" : String(geo[0]), color: "blue", char: String(amount) });
        }
    }

    if (isOdd(time) ) {
        map.clearMarkers(); // make map marker blink
    }

    // si.currentLoad(function(data) {
    //     for (let i = 0; i < data.cpus.length; i++) {
    //         //console.log(data.cpus[i].load)
    //     }
        
    // })
    

    screen.render();
}, 800);

