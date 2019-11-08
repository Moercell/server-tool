const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
const si = require('systeminformation');
const exec = require('child_process').exec;


const screen = blessed.screen({
    smartCSR: true
  });

const tWidth = process.stdout.columns;
const tHeight = process.stdout.rows;

var newLog = "";
var newLog2 = "";
var ip;
var geo;
var ipGroup = [];
var oldLog;
var oldIps = [];
var map;
var log;
var temp;
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
        map = grid.set(0, 0, 5, 12, contrib.map, {label: 'access log | apache', startLon: sLon, startLat: sLat, endLat: eLat, endLon: eLon});
    } else {
        map = grid.set(y, x, h, w, contrib.map, {label: 'access log | apache', startLon: sLon, startLat: sLat, endLat: eLat, endLon: eLon});
    }
    return map
}
function drawLog(w, h, y, x) {
    if (w === undefined) {
        log = grid.set(6, 0, 1, 12, contrib.log, { fg: "green", selectedFg: "green", label: 'access Log'});
    } else {
        log = grid.set(y, x, h, w, contrib.log, { fg: "green", selectedFg: "green", label: 'access Log'});
    }
    return log
}

var cpuData = [
    {
        title: 'cpu0',
        x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //'t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'
        y: [100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        style: { line: colors[3] }
    },
    {
        title: 'cpu1',
        x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        y: [100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        style: { line: colors[1] }
    }
];

var loadData = [
    {
        title: 'core00',
        x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        y: [100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        style: { line: colors[1] }
    },
    {
        title: 'core01',
        x: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        y: [100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        style: { line: colors[1] }
    }
    
]

// check for screen
// TODO: make responsive works
switch (tWidth, tHeight) {
    case 48, 21:
        var grid = new contrib.grid({rows: 9, cols: 12, screen: screen});
        drawMap(12, 6, 0, 0);
        drawLog(12, 2, 6, 0);
        break;
    case 160, 63:
        var grid = new contrib.grid({rows: 9, cols: 12, screen: screen});
        drawMap(12, 6, 0, 0);
        drawLog(12, 2, 6, 0);
        break;

    default:
        var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});
        drawMap(12, 5, 0, 0);
        drawLog(12, 1, 5, 0);
        var line = grid.set(6, 0, 3, 6, contrib.line,
            { 
            xLabelPadding: 0
            , xPadding: -5
            , showLegend: false
            , numYLabels: 5
            , maxY: 100
            , wholeNumbersOnly: false //true=do not show fraction in y axis
            , label: 'cpu temp'});
        var line2 = grid.set(6, 6, 3, 6, contrib.line,
            { 
            xLabelPadding: 0
            , xPadding: -5
            , showLegend: false
            , numYLabels: 5
            , maxY: 100
            , wholeNumbersOnly: false //true=do not show fraction in y axis
            , label: 'cpu speed'});
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
    //drawLog();
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
    if (newLog != newLog2 ) {
        newLog2 = newLog;
        log.log(String(newLog)); 
    }
       
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
    //   }
        
    // })

    // get cpu temp
    exec('sensors', (err, stdout, stderr) => { // istats for mac | sensors for ubuntu
        if (err) {
            console.log(err)
            return;}
        temp = stdout.split("\n");
        let tempLog = [];
        for (let i = 0; i < temp.length; i++) { 
           if (i == 2 ) {
                let temp2 = temp[i].split('+');
                let temp3 = temp2[1].split('°');
                let temp4 = parseInt(temp3);
                tempLog.push(temp4);
                cpuData[0].y.shift();
                cpuData[0].y.push(temp4);
           }
           if (i == 14 ) {
               var temp2 = temp[i].split('+');
               var temp3 = temp2[1].split('°');
               let temp4 = parseInt(temp3);
               tempLog.push(temp4);
               cpuData[1].y.shift();
               cpuData[1].y.push(temp4);
               
           }
          
        }
        var box = grid.set(8, 0, 1, 6, blessed.box, {content: 'cpu0: ' + tempLog[0] + '°C | cpu1: ' + tempLog[1] + '°C'})

    });
    line.setData(cpuData);
    line2.setData(loadData);
    screen.render();
}, 800);

