import sClient from '../../../../lib/sanity_client'

export async function get(req, res, next) {
  return sClient.getProject(req.user._id, req.params.id).then((project) => {
    res.json(project)
  })
}

export async function post(req, res, next) {
  return sClient.updateProject(req.user._id, req.params.id, req.body).then((project) => {
    res.json(project)
  })
  .catch(next);
}
