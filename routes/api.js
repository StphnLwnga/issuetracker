'use strict';

const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;

const Issue = require('../models/issue.js');

module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(async function (req, res) {
      try {
        let project = req.params.project;
        let issueData = req.query;
        // console.log(issueData)
        let data = Object.keys(issueData).length === 0 ? await Issue.find({ project }) : await Issue.find({ ...issueData, project });
        // console.log(data)
        res.json(data);
      } catch (error) {
        console.error(error)
      }
    })

    .post(async function (req, res) {
      let project = req.params.project;
      try {
        let project = req.params.project;

        // Parse body & query string parameters for data
        let issueData = Object.keys(req.body).length === 0 ? req.query : req.body;

        const { issue_title, issue_text, created_by, assigned_to, status_text } = issueData;
        const created_on = new Date().toISOString();
        const issue = new Issue({
          project,
          issue_title,
          issue_text,
          created_by,
          created_on,
          updated_on: created_on,
          assigned_to,
          status_text,
        });

        await issue.validateSync();

        const data = await issue.save();

        res.json({
          '_id': data.id,
          'issue_title': data.issue_title,
          'issue_text': data.issue_text,
          'created_on': data.created_on,
          'updated_on': data.updated_on,
          'created_by': data.created_by,
          'assigned_to': data.assigned_to,
          'status_text': data.status_text,
          'open': data.open,
        });
      } catch (e) {
        console.log(e.message);
        e.name === 'ValidationError' ? res.json({ error: 'required field(s) missing' }) : res.json({ error: e.message });
      }
    })

    .put(async function (req, res) {
      try {
        let project = req.params.project;
        let issueData = Object.keys(req.body).length === 0 ? req.query : req.body;
        var _id = issueData._id;

        // Throw error if missing id
        if (!_id) throw { error: 'missing _id', }

        // Check for & throw error if empty fields apart from id are being passed
        const filteredData = { ...issueData }
        delete filteredData._id;
        if (Object.values(filteredData).every(field => field === '') || Object.values(filteredData).length === 0) throw { error: 'no update field(s) sent', '_id': _id }

        // Update entry in database
        await Issue.findByIdAndUpdate(
          _id,
          { ...issueData, updated_on: new Date().toISOString(), }
        ).orFail({ error: 'could not update', _id: _id });

        res.json({ result: 'successfully updated', '_id': _id });
      } catch (error) {
        console.log(error);
        error.name === 'CastError' ? res.json({ error: 'could not update', _id: _id }) : res.json(error)
      }
    })

    .delete(async function (req, res) {
      try {
        let project = req.params.project;
        let issueData = Object.keys(req.body).length === 0 ? req.query : req.body;
        var _id = issueData._id;

        if (!_id) throw { error: 'missing _id' }

        await Issue.deleteOne({_id}).orFail({ error: 'could not delete', '_id': _id });

        res.json({ result: 'successfully deleted', '_id': _id })
      } catch (error) {
        console.log(error)
        error.name === 'CastError' ? res.json({ error: 'could not delete', '_id': _id }) : res.json(error)
      }
    });

};
