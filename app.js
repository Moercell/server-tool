const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');

const screen = blessed.screen()

var newLog = "";
var ip;
var geo;
var ipGroup = [];

function isOdd(num) { return num % 2;}

function getlog(log) {
    //logs = log.split(/\r?\n/);
    if (log != newLog) {
        newLog = log;
        ip = newLog.split(" ")[0];
        ipGroup.push(ip);
        if (ipGroup.length > 10) {
            ipGroup.shift();
        }
    }
    
    //geo = geoip.lookup(ip).ll;
}




var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})
var map = grid.set(0, 0, 6, 12, contrib.map, {label: 'access log | apache'});
var log = grid.set(5, 0, 1, 12,contrib.log, { fg: "green", selectedFg: "green", label: 'access Log'})


let time = 0;
setInterval(() => {
    time ++

    readLastLines.read('/var/log/apache2/access.log', 1).then((lines) => getlog(lines));

    log.log(String(newLog));    
    for (let i = 0; i < ipGroup.length; i++) {
        geo = geoip.lookup(ipGroup[i]).ll;
        map.addMarker({"lon" : String(geo[1]), "lat" : String(geo[0]), color: "blue", char: "߉" })
    }
    // check if there are many requests
    if (ipGroup.every( (val, j, arr) => val === arr[0] )) {
        geo = geoip.lookup(ipGroup[0]).ll;
        map.addMarker({"lon" : String(geo[1]), "lat" : String(geo[0]), color: "white", char: "߉" })
    }

    if (isOdd(time) ) {
        map.clearMarkers()
    }


    //var box = grid.set(6, 0, 3, 12, blessed.box, {label: 'debug box', content: String(logs)});

    
    screen.render();
}, 800);

