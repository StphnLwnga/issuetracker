const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const issueSchema = new Schema({
	"project": { type: String, required: true },
	"issue_title": { type: String, required: true },
	"issue_text": { type: String, required: true },
	"created_on": { type: String, required: true },
	"updated_on": { type: String, required: true },
	"created_by": { type: String, required: true },
	"assigned_to": { type: String, default: '' },
	"status_text": { type: String, default: '' },
	"open": { type: Boolean, default: true },
}, { versionKey: false });

const Issue = mongoose.model('issue_tracker', issueSchema);

module.exports = Issue;