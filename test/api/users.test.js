const env = require('../../config/environment');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../server');
//const sClient = require('../../lib/sanity_client');

const HTOKEN = jwt.sign({email: 'hallvord@hallvord.com'}, env.nconf.get('site:tokensecret'));

describe('Get user', function() {
  it('get user - not authorized', function(){
  	return request(app)
  	.get('/api/users/me')
  	.expect(302)
  	.expect('Location', '/feil/tilgang');
  });

  it('get user - bad token', function(){
  	return request(app)
  	.get('/api/users/me')
  	.set('Cookie', 'token=111')
  	.expect(302)
  	.expect('Location', '/feil/ukjent');
  });

  it('get user - correct token in cookie', function(){
  	return request(app)
  	.get('/api/users/me')
  	.set('Cookie', 'token=' + HTOKEN)
  	.expect(200)
  	.then(res => {
  		expect(res.body.name).toEqual('Hallvord Tester');
      expect(res.body.email).toEqual('hallvord@hallvord.com');
      expect(res.body.friendly_name).toEqual('HR');
      expect(res.body.phone).toEqual('48603894');

  		return Promise.resolve();
  	});
  });

});
