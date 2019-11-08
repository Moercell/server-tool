const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
const si = require('systeminformation');
const exec = require('child_process').exec;

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

    exec('sensors', (err, stdout, stderr) => {
    if (err) {
        console.log(err)
        return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(stdout);
    //console.log(`stderr: ${stderr}`);
    });
   

}, 500);