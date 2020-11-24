const express = require("express");
const router = express.Router({ mergeParams: true }); // eslint-disable-line
const multer = require("multer");
const storage = multer.memoryStorage();
const multerUpload = multer({ storage: storage });

const adminAuth = require("../lib/adminAuth");
const sClient = require("../lib/sanity_client");
const { parse, getName, getMemberNames } = require("./lib/mxml_helpers");

router.use(adminAuth);

router.get("/", (req, res, next) => {
	return sClient.getProjects(req.user._id).then((projects) => {
		res.json(projects);
	});
});

router.post("/new", multerUpload.single("mxmlfile"), (req, res, next) => {
	if (!req.file) {
		return res.status(400).json({ error: "Missing files" });
	}
	const bandName = req.body.band;
	const mxlmData = parse(req.file);
	const bandMembers = getMemberNames(mxlmData);
	const projName = getName(mxlmData);
	return ensureMembersExist(req.user._id, bandName, bandMembers).then(() => {
		return sClient
			.addProject(req.user._id, projName, req.file)
			.then((project) => {
				res.json(project);
			});
	});
});

module.exports = router;
