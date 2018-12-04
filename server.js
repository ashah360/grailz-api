'use strict';

// Env Vars
process.env.NODE_ENV = 'development';

// JWT Bearar Token Secret & Cookie Secret
process.env.COOKIE_SECRET = '<<>%!this$!@istot<@#$ally!<&#$area>^@#$llysu>#5per%#$^>secre,@#$%tt>@#$%!2#!$oken!#$%@^&';
process.env.TOKEN_SECRET = 'someco23$%#$%okies732$%3245ec1@#$rett5#$@hatsho@#$%@ldw5342ork123and@#$%2345ifnot!#%$@$%welltha253$%@#$%tsnotn&$%$#@ic%@#!#$en%@#$123%ow4!@isi!@t?'

// Stripe Token
process.env.STRIPE_TOKEN = 'sk_test_qaS4CGg86NdYdovMi5lbWaa1';

// mongoDB Atlas URL
process.env.MONGODB_URI = 'mongodb://admin:Nwp1uIGlcUkm9c2W@livehype-shard-00-00-ogihn.mongodb.net:27017,livehype-shard-00-01-ogihn.mongodb.net:27017,livehype-shard-00-02-ogihn.mongodb.net:27017/test?ssl=true&replicaSet=LiveHype-shard-0&authSource=admin&retryWrites=true'

require('console-stamp')(console, {
	metadata: function() {
		return ('[' + process.pid + ']');
	},
	colors: {
		stamp: 'yellow',
		label: 'white',
		metadata: 'green'
	}
});

// Node Modules
const cluster = require('cluster');
const mongoose = require('mongoose');
const system = require('os')
const path = require('path');
const fs = require('fs');

// Express Modules
const http = require('http');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

// Custom Modules
const APIRouter = require('./src/classes/APIRouter.js');

const app = express();

if (cluster.isMaster) {
	for (let i = 0; i < system.cpus().length; i++) {
		cluster.fork();
	}
}
else {
	app.server = http.createServer(app);

	// Setting up API router
	app.use(logger(':method :url :status :res[content-length] - :response-time ms'));
	app.use(cors());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json({ limit: '50mb' }));

	mongoose.connect(process.env.MONGODB_URI);

	mongoose.connection.once('open', () => {
		console.log('Connected to Database');

		new APIRouter(app);

		app.server.listen(process.env.PORT || 1337, () => console.log(`Listening @ http://127.0.0.1:${app.server.address().port}`));
	});

	mongoose.connection.on('error', (err) => {
		console.error(err);

		process.exit(1);
	});
}