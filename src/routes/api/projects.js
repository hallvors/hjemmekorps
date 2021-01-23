import multer from "multer";

const storage = multer.memoryStorage();
const multerUpload = multer({ storage: storage });

import sClient from "../../lib/sanity_client";
import {
	parseFile,
	getName,
	getMemberNames,
	getPartsList,
} from "../../lib/mxml_helpers";

export async function get(req, res, next) {
	return sClient.getProjects(req.user._id).then((projects) => {
		res.json(projects);
	});
}

export async function post(req, res, next) {
	multerUpload.single("file")(req, res, () => {
		if (!req.file) {
			res.statusCode = 400;
			return res.json({ error: "Missing files" });
		}
		const bandId = req.body.band;
		const mxlmData = parseFile(req.file);
		const bandMembers = getMemberNames(mxlmData);
		const partslist = getPartsList(mxlmData);
		const projName = getName(mxlmData);
		return sClient
			.ensureMembersExist(req.user._id, bandId, bandMembers)
			.then((memberData) => {
				return sClient
					.addProject(
						req.user._id,
						projName,
						req.file,
						partslist,
						memberData
					)
					.then((project) => {
						res.json(project);
					});
			});
	});
}
