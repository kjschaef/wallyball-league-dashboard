/**
 * Simple HTTP test to verify chai-http functionality
 */
import * as chai from 'chai';
// @ts-ignore - Import chai-http with proper module handling 
import chaiHttp from 'chai-http';
import express from 'express';

// Use chai with HTTP plugin
chai.use(chaiHttp);
const { expect } = chai;

describe('Chai HTTP Test', () => {
  it('should make a basic HTTP request to a simple Express app', (done) => {
    const app = express();
    
    // Add a simple route
    app.get('/test', (_req, res) => {
      res.json({ message: 'success' });
    });
    
    // Use chai HTTP
    chai.request(app)
      .get('/test')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('message', 'success');
        done();
      });
  });
});