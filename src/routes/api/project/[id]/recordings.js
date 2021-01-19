import multer from 'multer'

const storage = multer.memoryStorage()
const multerUpload = multer({ storage: storage })

import sClient from '../../../../lib/sanity_client'

export async function get(req, res, next) {
  return sClient.getRecordings(req.params.id).then((recordings) => {
    res.json(recordings)
  })
}

export async function post(req, res, next) {
  multerUpload.single('file')(req, res, (req, res) => {
    return sClient
      .addProjectRecording(req.body.projectId, req.body.memberId, req.file.path)
      .then((project) => {
        res.json(project)
      })
  })
}
