const env = require('../../src/config/environment');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/server');
//const sClient = require('../../lib/sanity_client');

const HTOKEN = jwt.sign({email: 'hallvord@hallvord.com'}, env.config.site.tokensecret);

describe('Get bands', function() {
  it('get band - not authorized', function(){
  	return request(app.handler)
  	.get('/api/bands/')
  	.expect(302)
  	.expect('Location', '/feil/tilgang');
  });

  it('get band - bad token', function(){
  	return request(app.handler)
  	.get('/api/bands/')
  	.set('Cookie', 'token=111')
  	.expect(302)
  	.expect('Location', '/feil/ukjent');
  });

  it('get band - correct token in cookie', function(){
  	return request(app.handler)
  	.get('/api/bands/')
  	.set('Cookie', 'token=' + HTOKEN)
  	.expect(200)
  	.then(res => {
      expect(res.body).toHaveLength(1);
  		expect(res.body[0].name).toEqual('Testmann Minnes skoles musikkorps');
      expect(res.body[0].logo).toBeDefined();
      expect(res.body[0].owner[0]._ref).toEqual('4f70f677-5827-46c8-ba43-70ab60b8817f');
  		return Promise.resolve();
  	});
  });

});
