const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
const si = require('systeminformation');
const exec = require('child_process').exec;
var spawn = require('child_process').spawn;

// uptime
si.getDynamicData(function(data) {
    uptime = data.time.uptime
    days = Math.floor(((uptime / 60) / 60)/ 24);
    hours = Math.floor((uptime / 60 / 60) - (days * 24));
    minutes =  Math.floor((uptime / 60) - (days * 24 * 60 + hours * 60));
    console.log(days + ' d', hours + ' h', minutes + ' m');

})

// cpu speed
si.currentLoad(function(data) {
    console.log(data.cpus[1].load);
})

setInterval(() => {


    

    temp = spawn('cat', ['/sys/class/thermal/thermal_zone0/temp']);

    temp.stdout.on('data', function(data) {
            console.log('Result: ' + data/1000 + ' degrees Celcius');
    });

}, 500);