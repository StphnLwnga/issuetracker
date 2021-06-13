'use strict';

const mongoose = require('mongoose');

const Issue = require('../models/issue.js');

module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(async function (req, res) {
      try {
        let project = req.params.project;
        let issueData = req.query;
        // console.log(issueData)
        let data = issueData ? await Issue.find({ project }) : await Issue.find({ ...issueData, project });
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
        let _id = issueData._id;

        if (!_id) throw { error: 'missing _id', }

        // Filter by g
        const filteredData = await Object.fromEntries(
          Object
            .entries(issueData)
            .filter(entry => (entry[1] === '' || entry[0] === '_id') ? true : false)
        );
        
        // throw error 
        if (Object.keys(filteredData).length === 0) throw { error: 'no update field(s) sent', '_id': _id }

        await Issue.findByIdAndUpdate(
          _id,
          { ...issueData, updated_on: new Date().toISOString(), }
        ).orFail({ error: 'could not update', _id: _id });

        res.json({ result: 'successfully updated', '_id': _id })
      } catch (error) {
        console.log(error);
        error.name === 'CastError' ? res.json({ error: 'could not update', _id: req.body._id }) : res.json(error)
      }
    })

    .delete(async function (req, res) {
      try {
        let project = req.params.project;
      } catch (error) {

      }
    });

};
