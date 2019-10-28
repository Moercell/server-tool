const blessed = require('blessed');
const contrib = require('blessed-contrib');
const readLastLines = require('read-last-lines');

var screen = blessed.screen()

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})


//grid.set(row, col, rowSpan, colSpan, obj, opts)
var map = grid.set(0, 0, 5, 10, contrib.map, {label: 'access log | apache'})
var box = grid.set(4, 0, 1, 10, blessed.box, {content: readLastLines.read('/var/log/apache2/access.log', 4)})

screen.render()