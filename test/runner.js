/**
 * Run integration tests
 *
 * Uses the `waterline-adapter-tests` module to
 * run mocha tests against the appropriate version
 * of Waterline.  Only the interfaces explicitly
 * declared in this adapter's `package.json` file
 * are tested. (e.g. `queryable`, `semantic`, etc.)
 */


/**
 * Module dependencies
 */

var util = require('util');
var mocha = require('mocha');
var TestRunner = require('waterline-adapter-tests');
var Adapter = require('../lib/adapter');



// Grab targeted interfaces from this adapter's `package.json` file:
var package = {},
  interfaces = [],
  features = [];
try {
  package = require('../package.json');
  interfaces = package.waterlineAdapter.interfaces;
  features = package.waterlineAdapter.features;
} catch (e) {
  throw new Error(
    '\n' +
    'Could not read supported interfaces from `waterlineAdapter.interfaces`' + '\n' +
    'in this adapter\'s `package.json` file ::' + '\n' +
    util.inspect(e)
  );
}



console.log('Testing `' + package.name + '`, a Sails/Waterline adapter.');
console.log('Running `waterline-adapter-tests` against ' + interfaces.length + ' interfaces...');
console.log('( ' + interfaces.join(', ') + ' )');
console.log();
console.log('Latest draft of Waterline adapter interface spec:');
console.log('http://sailsjs.com/documentation/concepts/extending-sails/adapters');
console.log();


/**
 * Integration Test Runner
 *
 * Uses the `waterline-adapter-tests` module to
 * run mocha tests against the specified interfaces
 * of the currently-implemented Waterline adapter API.
 */
new TestRunner({

  // Mocha opts
  mocha: {
    bail: true
  },

  // Load the adapter module.
  adapter: Adapter,

  // Default connection config to use.
  config: {
    identity: 'default',
    credential: {
      "type": "service_account",
      "project_id": "banana-b510e",
      "private_key_id": "bb549e9605ebbf1355feb49f33de904fea081f46",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6rB5kMJ42ie74\n0eaGpYFRyn8XgL+IficNOtcnK+t+RpZhQ5igNyAU/vQaQcMhxOtTaOoEToyUJmG1\ntQEKsJTbQzu6s9BQixPr/zOHJ++af2Bq1k/trkJq7qc93OkGXCvFYIP+Yug/48Ew\na4OYXGBQnY++dyAQfKiYlOk0NBbuMVmDG92diJ2P3WuIYRmqmSjE0NMOOud2neBT\nF1tC/kxo/3YwAnQbEWLu1ZFR8fk0swhDEYOwGNgduD/fHtopY5iCTuiVMmTbov4l\n6ZiJ7spK3HCduhziPctkAJLcZTClBCIW3Gc9ryPkcNJbL5H3JcUEjx0aCbQEbp2s\n5Y65I+TdAgMBAAECggEAMYhmcBNuh+5F2QRpdSUJkZh37Nae/CrtVdddK+m9jT5R\nvPFg2HKIMsoMH8N/ccB86R8XqZjmOJGOr9adtiZw+VV3zezUw+qDmMWY+K4iKA7Q\nmMjRYLIysYkuG3443xUqEC+yFphMJFfc9Wox+wXYEMweTl3xxi4t1n78+nsv8nf1\nASp2QCSQjNn4+819lFKTmHmpG81p0XOBfNJF+w1Rj6S31aGZ79+TwlcT+uEeZEdd\nmE64bIeiRmOQZrDPiW5GdtcZcycB1M0FEzSFNPF6UQg6ud7kwfEE76HikguYmaAN\nLSMuJwEnXA/OOXFEppA8ZRqap7Ln9cu/L2NlrqBTwQKBgQD2LzB67ElwrYJg+a9y\n2fZRquc45IJxaXXulxYHpSeQRjBSmO+GrI1TAXiql/HIOT3hogsG2PNKyKi4rbyz\nVQtcTMjeao4abwAbvH3iTxSP+BPk7uPViHCYyKzEeP2YP5q2fUAMj3mHMQ7Ea2sL\nI/O3zOvMzTwKzsD2MAvNGnaRFQKBgQDCHX0ahUcOPlNM5N1DvqUFKazPZwL0nFfr\n11TBCKLRu34IjppWqneknI+nqXettVRxRRKbaZdkrBgdFFXmfqQjhSRJjUu+V1ZH\nEkcb7mGGkjkqZ4iZ1edb4AiMhvBf0dZ97M8nCUFED9B86lQOWZYNffXumzbkd21W\niMuqzUEmqQKBgQDkwiDIeHwdqf0244z2qjbK2IYXRa84d4jQdbBQ1lSXKcGJXvdk\nKz7/XKSl0J8pMJeh7JNWf45DdYXiZf6snV/7Gpakplr5kR+GpnZLLrSquxixaJJp\nP2lxbzerMcpkCOZYoLY9day1xQ410qMbLQMxTcfm/ObIHCsOGMM+iVKXqQKBgGAA\nbYrcN1QYBuKUncmPU9XF0q2QaKnJWMJO8J+3Qa8wZxicTkBmdl13AKUO7x19/JE4\ndAdgpXsokZRwJjukjlDy3At0Ue2FDCqCI6DwuFLxpkwOgER0wcNyfUfixKbfBJGq\nuJi5vwmGOLpOuduO+uMZVLP5F6DOX8jYRsHmWT5hAoGAOqch+NE0+5YuncIO3i9R\nv7P/BDJMd71ETa5zYrgddKUq88EBKOUbA0KaTvZGhZlUIo0FFFEcvw2QmY/vj7Kz\nhOrUewgczffkZkpfbFLKoe/4KwDH7Fah1esv+UQfDusC0HpCUsIySP4iaL3Q646a\ncPHnn4nMjxfAmUm2SFWfw8c=\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-0hixf@banana-b510e.iam.gserviceaccount.com",
      "client_id": "106944132696335749312",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://accounts.google.com/o/oauth2/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-0hixf%40banana-b510e.iam.gserviceaccount.com"
    },
    databaseURL: 'https://banana-b510e.firebaseio.com',
    filePath: '.tmp/',
    schema: false
  },

  // The set of adapter interfaces to test against.
  // (grabbed these from this adapter's package.json file above)
  interfaces: interfaces,

  // The set of adapter features to test against.
  // (grabbed these from this adapter's package.json file above)
  features: features,

  // Most databases implement 'semantic' and 'queryable'.
  //
  // As of Sails/Waterline v0.10, the 'associations' interface
  // is also available.  If you don't implement 'associations',
  // it will be polyfilled for you by Waterline core.  The core
  // implementation will always be used for cross-adapter / cross-connection
  // joins.
  //
  // In future versions of Sails/Waterline, 'queryable' may be also
  // be polyfilled by core.
  //
  // These polyfilled implementations can usually be further optimized at the
  // adapter level, since most databases provide optimizations for internal
  // operations.
  //
  // Full interface reference:
  // https://github.com/balderdashy/sails-docs/blob/master/adapter-specification.md
});
