const readLastLines = require('read-last-lines');
readLastLines.read('/var/log/apache2/access.log', 10)
	.then((lines) => console.log(lines));