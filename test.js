const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');
const geoip = require('geoip-lite');
const si = require('systeminformation');
const exec = require('child_process').exec;




async function getCpu() {
    let cpuTemp = await si.cpuTemperature();
    //var box = grid.set(6, 6, 3, 6, blessed.box, {label: 'debug box', content: String(cpuTemp)});
    //temp
}

console.log(getCpu());