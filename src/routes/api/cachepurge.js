import sClient from '../../lib/sanity_client';

export async function get(req, res, next) {
    await sClient.purgeCache();
    res.end('ok')
}
