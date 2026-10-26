'use strict';

/**
 * Frontend tests have no database client. Any helper that is handed a Mongo
 * connection string must stop here instead of opening it.
 */
function refuseFrontendDatabase(value) {
  const text = String(value || '');
  if (/mongodb(\+srv)?:\/\//i.test(text)) {
    throw new Error('Frontend tests cannot open MongoDB. Database access stays in the backend isolated test guard.');
  }
}

module.exports = { refuseFrontendDatabase };
