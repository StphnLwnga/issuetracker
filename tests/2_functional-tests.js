const chaiHttp = require('chai-http');
const ObjectID = require('mongodb').ObjectID
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
	const endpoint = '/api/issues/functionaltests';

	let _testId;
	let _delId;

	test('POST an issue with every field', function (done) {
		chai
			.request(server)
			.post(endpoint)
			.type('form')
			.send({
				issue_title: 'Functional test b)',
				issue_text: 'Attemting to POST issue',
				created_by: 'chai',
				assigned_to: 'mongodb',
				status_text: 'Issue creation test',
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				[
					'_id', 'issue_title', 'issue_text', 'created_by', 'assigned_to',
					'status_text', 'created_on', 'updated_on', 'open'
				].every(prop => assert.property(res.body, prop));
				assert.equal(res.body.created_on, res.body.updated_on);
				assert.isTrue(ObjectID.isValid(res.body._id));
				_testId = res.body._id;
				done();
			});
	});

	test('POST an issue only with required fields', function (done) {
		chai
			.request(server)
			.post(endpoint)
			.send({
				issue_title: 'POST - Functional test 2b)',
				issue_text: 'Attemting to POST issue with only required fields',
				created_by: 'chai',
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				[
					'_id', 'issue_title', 'issue_text', 'created_by', 'assigned_to',
					'status_text', 'created_on', 'updated_on', 'open'
				].every(prop => assert.property(res.body, prop));
				assert.equal(res.body.created_on, res.body.updated_on);
				assert.isTrue(ObjectID.isValid(res.body._id));
				done();
			});
	});

	test('POST an issue missing required fields', function (done) {
		chai
			.request(server)
			.post(endpoint)
			.send({
				assigned_to: 'mongodb',
				status_text: 'Issue creation test with missing fields',
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.property(res.body, 'error')
				assert.equal(res.body.error, 'required field(s) missing');
				done();
			});
	});

	test('GET issues', function (done) {
		chai
			.request(server)
			.get(endpoint)
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.isArray(res.body);
				res.body.every(doc => assert.isTrue(ObjectID.isValid(doc._id)));
				_delId = res.body[0]._id;
				done();
			});
	});

	test('GET issues with a filter', function (done) {
		chai
			.request(server)
			.get(endpoint)
			.query({ open: true, created_by: 'chai' })
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.isArray(res.body);
				res.body.every(
					doc => assert.isTrue(ObjectID.isValid(doc._id))
						&& assert.isTrue(doc.open)
				);
				done();
			});
	});

	test('GET issues with multiple filters', function (done) {
		chai
			.request(server)
			.get(endpoint)
			.query({ open: true, created_by: 'chai', project: 'functionaltests', })
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.isArray(res.body);
				res.body.every(
					doc => assert.isTrue(ObjectID.isValid(doc._id))
						&& assert.isTrue(doc.open)
						&& assert.equal(doc.created_by, 'chai')
						&& assert.equal(doc.project, 'functionaltests')
				);
				done();
			});
	});

	test('Update one field on an issue', function (done) {
		chai
			.request(server)
			.put(endpoint)
			.send({
				'_id': _testId,
				issue_text: 'Attempted update to the issue_text field only'
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.property(res.body, 'result');
				assert.equal(res.body._id, _testId);
				assert.equal(res.body.result, 'successfully updated');
				done();
			})
	});

	test('Update multiple fields on an issue', function (done) {
		chai
			.request(server)
			.put(endpoint)
			.send({
				_id: _testId,
				issue_text: 'Updating multiple fields',
				assigned_to: 'chai and mocha',
				status_text: 'Second update on this issue',
				open: false,
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.property(res.body, 'result');
				assert.equal(res.body._id, _testId);
				assert.equal(res.body.result, 'successfully updated');
				done();
			});
	});

	test('Update an issue with a missing _id', function (done) {
		chai
			.request(server)
			.put(endpoint)
			.send({
				issue_text: 'Updating multiple fields without an id',
				assigned_to: 'chai and mocha',
				status_text: 'Third update on this issue',
				open: true,
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.property(res.body, 'error');
				assert.equal(res.body.error, 'missing _id');
				done();
			});
	});

	test('Update an issue with no field to update', function (done) {
		chai
			.request(server)
			.put(endpoint)
			.send({
				_id: _testId,
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.equal(res.body._id, _testId);
				assert.property(res.body, 'error');
				assert.equal(res.body.error, 'no update field(s) sent');
				done();
			})
	});

	test('Update an issue with an invalid _id', function (done) {
		chai
			.request(server)
			.put(endpoint)
			.send({
				_id: 'xxxxxxxxxxxxxxxxxxxxxxxx',
				issue_text: 'Updating multiple fields without a valid id',
				assigned_to: 'chai and mocha',
				status_text: 'Fourth update on this issue',
				open: true,
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				// console.log(res.body)
				assert.property(res.body, 'error');
				assert.equal(res.body.error, 'could not update');
				done();
			})
	});

	test('DELETE request successfully sent', function (done) {
		chai
			.request(server)
			.delete(endpoint)
			.send({
				_id: _delId,
			})
			.end(function (err, res) {
				// console.log(`delId: ${_delId}`)
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.equal(res.body._id, _delId);
				assert.property(res.body, 'result');
				assert.equal(res.body.result, 'successfully deleted');
				done();
			})
	});

	test('DELETE issue with an invalid _id', function (done) {
		chai
			.request(server)
			.delete(endpoint)
			.send({
				_id: 'xxx123',
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				// console.log(res.body._id)
				assert.equal(res.body._id, 'xxx123');
				assert.property(res.body, 'error');
				assert.equal(res.body.error, 'could not delete');
				done();
			})
	});

	test('DELETE an issue with a missing _id', function (done) {
		chai
			.request(server)
			.delete(endpoint)
			.send({})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.include(res.headers['content-type'], 'application/json');
				assert.property(res.body, 'error');
				assert.equal(res.body.error, 'missing _id');
				done();
			})
	});

});
