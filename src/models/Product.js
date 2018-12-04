'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Vote = require('./Vote.js');

const uuidv4 = require('uuid/v4');

const product = new Schema({
	_id: { type: String, required: false, default: uuidv4() },
	created_at: { type: Date, required: false, default: Date.now() },
	title: { type: String, required: true },
	active: { type: Boolean, required: true },
	release: { type: String, required: true },
	images: { type: {
		product: { type: String, required: true },
		pass: { type: String, required: true }
	}, required: true },
	price: { type: {
		usd: { type: String, required: true },
		gbp: { type: String, required: true }
	}, required: true },
	votes: { type: [Vote], required: false, default: [] }
});

module.exports = mongoose.model('product', product);