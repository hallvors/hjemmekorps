const env = require('../../config/environment');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../server');
//const sClient = require('../../lib/sanity_client');

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
  	.set('Cookie', 'token=' + jwt.sign({email: 'hallvord@hallvord.com'}, env.nconf.get('site:tokensecret')))
  	.expect(200)
  	.then(res => {
  		expect(res.body).toHaveLength(1);
  		expect(res.body[0].name).toEqual('Test musikk 1');
  		expect(res.body[0].sheetmusic).toBeDefined();

  		return Promise.resolve();
  	});
  });

});
