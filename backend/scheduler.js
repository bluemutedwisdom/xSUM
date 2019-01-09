var express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./routes/router')
    config = require('./config/config');

var Scheduler = require('./scheduler/scheduler');

var port = config.PORT;
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRouter);
app.listen(port);

// Start Scheduler
Scheduler.startScheduler();
