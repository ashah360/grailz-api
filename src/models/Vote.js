'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uuidv4 = require('uuid/v4');

const vote = new Schema({
	_id: { type: String, required: false, default: uuidv4() },
	client: { type: String, required: true },
	result: { type: Boolean, required: true },
	created_at: { type: Date, required: false, default: Date.now() }
});

module.exports = vote;