'use strict';

const express = require('express');
const jwtMiddleware = require('express-jwt');
const cookieSession = require('cookie-session');

const setUpProductRoutes = require('../routers/Product.js');

class APIRouter {
	constructor(api) {
		this.api = api;
		this.apiVersion = require('../../package.json').version;

		this.accessKey = 'dbf757d6-b996-11e8-96f8-529269fb1459';

		this.statusCodes = {
			OK: 200,
			CREATED: 201,
			ACCEPTED: 202,
			NO_CONTENT: 204,
			REDIRECT: 302,
			NOT_MODIFIED: 304,
			BAD_REQUEST: 400,
			UNAUTHORIZED: 401,
			FORBIDDEN: 403,
			NOT_FOUND: 404,
			DISALLOWED_METHOD: 405,
			UNPROCESSABLE_ENTITY: 422,
			SERVER_ERROR: 500,
			BAD_GATEWAY: 502
		};

		this.setUpRoutes = this.setUpRoutes.bind(this);

		this.setUpProductRoutes = setUpProductRoutes.bind(this);

		api.get('/', (req, res) => {
			return res.status(this.statusCodes.OK).json({ 
				version: this.apiVersion,
				message: 'API for grailz'
			});
		});

		this.setUpRoutes();
	}

	setUpRoutes() {
		const api = this.api;

		// Attaches default token to `req.user` by default
		api.use(jwtMiddleware({
		  	secret: process.env.TOKEN_SECRET,
		  	credentialsRequired: false,
		  	getToken: (req) => { // Gets token from header OR query string
		    	if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
		        	return req.headers.authorization.split(' ')[1];
		    	} 
		    	else if (req.query && req.query.token) {
		      		return req.query.token;
		   	 	}
		   	 	else if (req.session && req.session.token) {
		   	 		return req.session.token;
		   	 	}
		    	return null;
		  	}	
		}).unless(['/account/authenticate']));

		api.use((err, req, res, next) => {
		  	if (err.name === 'UnauthorizedError') {
		    	return res.status(this.statusCodes.UNAUTHORIZED).json({
		    		message: 'unauthorized bearer token - retry login',
		    		errors: [{
		    			path: req.path
		    		}]
		    	});
		  	}
		});

		api.use(cookieSession({
			name: 'session',
			secret: process.env.COOKIE_SECRET
		}));

		const ProductRouter = express();

		api.use('/product', ProductRouter);

		this.setUpProductRoutes(ProductRouter);

		api.all('*', (req, res) => {
			return res.status(this.statusCodes.BAD_REQUEST).json({
				message: 'invalid path and/or method',
				errors: [{
					path: req.path
				}]
			});
		});
	}
}

module.exports = APIRouter;