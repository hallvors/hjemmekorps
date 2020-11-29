const env = require('../../config/environment');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../server');
//const sClient = require('../../lib/sanity_client');

const HTOKEN = jwt.sign({email: 'hallvord@hallvord.com'}, env.nconf.get('site:tokensecret'));

describe('Get projects', function() {
  it('listing projects - not authorized', function(){
  	return request(app)
  	.get('/api/projects')
  	.expect(302)
  	.expect('Location', '/feil/tilgang');
  });

  it('listing projects - bad token', function(){
  	return request(app)
  	.get('/api/projects')
  	.set('Cookie', 'token=111')
  	.expect(302)
  	.expect('Location', '/feil/ukjent');
  });

  it('listing projects - correct token in cookie', function(){
  	return request(app)
  	.get('/api/projects')
  	.set('Cookie', 'token=' + HTOKEN)
  	.expect(200)
  	.then(res => {
  		expect(res.body).toHaveLength(1);
  		expect(res.body[0].name).toEqual('Test musikk 1');
  		expect(res.body[0].sheetmusic).toBeDefined();

  		return Promise.resolve();
  	});
  });

  xit('create project by upload', function(){
    return request(app)
    .post('/api/projects/new')
    .set('Cookie', 'token=' + HTOKEN)
    .attach('mxmlfile', __dirname + '/fixtures/Nu_grönskar_det.xml')
    .expect(200)
    .then(res => {


      return Promise.resolve();
    });

  });

});
