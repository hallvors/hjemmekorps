const fxp = require("fast-xml-parser");
const fs = require("fs");

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
	if (
		mxmlData["score-partwise"] &&
		mxmlData["score-partwise"]["part-list"] &&
		mxmlData["score-partwise"]["part-list"]["score-part"]
	) {
		let members = mxmlData["score-partwise"]["part-list"]["score-part"].map(
			(part) => {
				let names = part["part-name"]
					.split(/, */g)
					.map((name) => name.replace(/\(.*$/, '')); // remove (JK) or (1) annotations
				return names;
			}
		);
		return members.flat();
	}
	throw new Error("unexpected MXML data");
}

module.exports = {
	parse,
	getName,
	getMemberNames,
};
