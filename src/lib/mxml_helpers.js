const env = require("../config/environment");

const fxp = require("fast-xml-parser");
const fs = require("fs");
const _ = require("underscore");

function parse(file) {
	return fxp.parse(file.buffer.toString("utf-8"));
}

function getName(mxmlData) {
	return (
		(mxmlData["score-partwise"] &&
			mxmlData["score-partwise"]["work"] &&
			mxmlData["score-partwise"]["work"]["work-title"]) ||
		null
	);
}

function getMemberNames(mxmlData) {
	const instruments = nconf.get("instruments");

	if (
		mxmlData["score-partwise"] &&
		mxmlData["score-partwise"]["part-list"] &&
		mxmlData["score-partwise"]["part-list"]["score-part"]
	) {
		let members = mxmlData["score-partwise"]["part-list"]["score-part"].map(
			(part) => {
				let names = part["part-name"]
					.split(/, */g)
					.map((name) => name.replace(/\(.*$/, "")); // remove (JK) or (1) annotations
				return names;
			}
		);
		// some conductors will label the musical parts with the names of the kids playing
		// others will however leave the instruments - we remove any names that match instruments
		members = _.flatten(members).filter((name) => {
			return !instruments.find((instrument) => {
				return (
					name.toLowerCase().indexOf(instrument.title.toLowerCase()) >
						-1 || name.toLowerCase().indexOf(instrument.value) > -1
				);
			});
		});
		return members;
	}
	throw new Error("unexpected MXML data");
}

module.exports = {
	parse,
	getName,
	getMemberNames,
};
