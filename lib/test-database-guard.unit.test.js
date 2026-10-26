'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { refuseFrontendDatabase } = require('./test-database-guard');

describe('frontend database guard', () => {
  it('refuses a Mongo connection string', () => {
    assert.throws(
      () => refuseFrontendDatabase('mongodb://127.0.0.1:27017/apl_development'),
      /cannot open MongoDB/,
    );
  });

  it('allows a helper that has no database URI', () => {
    assert.doesNotThrow(() => refuseFrontendDatabase(''));
  });
});
