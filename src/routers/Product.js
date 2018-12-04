'use strict';

const uuidv4 = require('uuid/v4');

const Product = require('../models/Product.js')
const Vote = require('../models/Vote.js');

const BASE_PATH = '/product';

module.exports = function(router) {
	router.get('/list', (req, res) => {
		req.query.filter = (req.query.filter) ? req.query.filter.replace(/\s/g, '').replace(/,/g, ' ') + ' -stripe_id' : '-stripe_id';

		Product.find({}, req.query.filter, (err, products) => {
			if (err) {
				console.error(err);

				return res.status(this.statusCodes.SERVER_ERROR).json({
					message: 'error finding products',
					errors: [{
						path: BASE_PATH + req.path
					}]
				});
			}
			else {
				return res.status(this.statusCodes.OK).json(products);
			}
		});
	});

	router.get('/:id', (req, res) => {
		req.query.filter = (req.query.filter) ? req.query.filter.replace(/\s/g, '').replace(/,/g, ' ') + ' -stripe_id' : '-stripe_id';

		Product.findById(req.params.id, req.query.filter, (err, product) => {
			if (err) {
				console.error(err);

				return res.status(this.statusCodes.SERVER_ERROR).json({
					message: 'error finding product',
					product_id: req.params.id,
					errors: [{
						path: BASE_PATH + req.path
					}]
				});
			}
			else {
				if (product) {
					return res.status(this.statusCodes.OK).json(product);
				}
				else {
					return res.status(this.statusCodes.NOT_FOUND).json({
						message: 'product not found',
						product_id: req.params.id,
						errors: [{
							path: BASE_PATH + req.path
						}]
					});
				}
			}
		});
	});

	router.post('/:id/vote', (req, res, next) => {
		const client = req.get('x-forwarded-for') || req.connection.remoteAddress || req.ip;

		Product.findById(req.params.id, (err, product) => {
			if (err) {
				console.error(err);

				return res.status(this.statusCodes.SERVER_ERROR).json({
					message: 'error finding product',
					body: req.body,
					product_id: req.params.id,
					errors: [{
						path: BASE_PATH + req.path
					}]
				});
			}
			else {
				if (product) {
					const clientVoteExists = product.votes.find((vote) => vote.client === client);

					if (clientVoteExists) {
						return res.status(this.statusCodes.FORBIDDEN).json({
							message: 'vote already submitted by client for this product',
							body: req.body,
							product_id: req.params.id,
							errors: [{
								path: BASE_PATH + req.path
							}]
						});
					}
					else {
						next();
					}
				}
				else {
					return res.status(this.statusCodes.NOT_FOUND).json({
						message: 'product not found',
						body: req.body,
						product_id: req.params.id,
						errors: [{
							path: BASE_PATH + req.path
						}]
					});
				}
			}
		});
	});
	router.post('/:id/vote', (req, res) => {
		const client = req.get('x-forwarded-for') || req.connection.remoteAddress || req.ip;

		const vote = {
			client,
			result: req.body.result
		};

		Product.findByIdAndUpdate(req.params.id, {
			$push: {
				votes: vote
			}
		}, { new: true }, (err, product) => {
			if (err) {
				console.error(err);

				return res.status(this.statusCodes.SERVER_ERROR).json({
					message: 'error finding product',
					body: req.body,
					product_id: req.params.id,
					errors: [{
						path: BASE_PATH + req.path
					}]
				});
			}
			else {
				if (product) {
					return res.status(this.statusCodes.CREATED).json({
						message: 'vote submitted',
						vote: req.body,
						product_id: req.params.id
					});
				}
				else {
					return res.status(this.statusCodes.NOT_FOUND).json({
						message: 'product not found',
						body: req.body,
						product_id: req.params.id,
						errors: [{
							path: BASE_PATH + req.path
						}]
					});
				}
			}
		});
	});

	// Admin Only Endpoints
	router.post('/create', (req, res) => {
		if (req.get('access-key') !== this.accessKey) {
			return res.status(this.statusCodes.FORBIDDEN).json({
				message: 'unauthorized access',
				errors: [{
					path: BASE_PATH + req.path
				}]
			});
		}

		try { 
			const product = new Product(req.body);

			product.save()
				.then(() => {
					if (!product.isNew) {
						return res.status(this.statusCodes.CREATED).json({
							message: 'new product created',
							product,
						});
					}
					else {
						return res.status(this.statusCodes.SERVER_ERROR).json({
							message: 'error saving product',
							body: req.body,
							errors: [{
								path: BASE_PATH + req.path
							}]
						});
					}
				})
				.catch((e) => {
					console.error(e);

					return res.status(this.statusCodes.UNPROCESSABLE_ENTITY).json({
						message: 'missing parameters',
						body: req.body,
						errors: [{
							path: BASE_PATH + req.path
						}]
					});
				});
		}
		catch (e) {
			console.error(e);

			return res.status(this.statusCodes.UNPROCESSABLE_ENTITY).json({
				message: 'missing parameters',
				body: req.body,
				errors: [{
					path: BASE_PATH + req.path
				}]
			});
		}
	});

	router.all('/:id/:action', (req, res) => {
		if (req.get('access-key') !== this.accessKey) {
			return res.status(this.statusCodes.FORBIDDEN).json({
				message: 'unauthorized access',
				errors: [{
					path: BASE_PATH + req.path
				}]
			});
		}

		switch (req.params.action) {
			case 'activate':
			case 'deactivate':
				Product.findByIdAndUpdate(req.params.id, {
					$set: {
						active: (req.params.action === 'activate')
					}
				}, { new: true }, (err, product) => {
					if (err) {
						console.error(err);

						return res.status(this.statusCodes.SERVER_ERROR).json({
							message: 'error updating product',
							product_id: req.params.id,
							errors: [{
								path: BASE_PATH + req.path
							}]
						});
					}
					else {
						const success = (req.params.action === 'activate') ? product.active : !product.active;

						if (product && success) {
							return res.status(this.statusCodes.OK).json({
								message: 'updated product',
								product
							});
						}
						else {
							return res.status(this.statusCodes.SERVER_ERROR).json({
								message: 'error updating product',
								product_id: req.params.id,
								errors: [{
									path: BASE_PATH + req.path
								}]
							});
						}
					}
				});
				break;

			case 'delete':
				Product.findByIdAndDelete(req.params.id, (err, item) => {
					if (err) {
						return res.status(this.statusCodes.SERVER_ERROR).json({
							message: 'error deleting product',
							product_id: req.params.id,
							errors: [{
								path: BASE_PATH + req.path
							}]
						});
					}
					else {
						return res.status(this.statusCodes.NO_CONTENT).json({
							message: 'product deleted',
							product_id: req.params.id
						});
					}
				});
				break;

			default:
				return res.status(this.statusCodes.BAD_REQUEST).json({
					message: 'invalid action',
					product_id: req.params.id,
					product_action: req.params.action,
					errors: [{
						path: BASE_PATH + req.path
					}]
				});
		}
	});
};