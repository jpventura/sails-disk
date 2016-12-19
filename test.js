const admin = require('firebase-admin');
const _ = require('lodash');
const Map = require('./lib/util/ObservableMap');

const config = {
  autoPk: false,
    identity: 'default',
    credential: admin.credential.cert({
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
  }),
  databaseURL: 'https://banana-b510e.firebaseio.com'
};

// const application = admin.initializeApp(config, 'default');

// const schemas = new Map(application.database().ref('schemas'));

// schemas.put('1', '1341234').then((data) => console.log('>>> ' + data), (error) => {console.error(error)});


// schemas.subscribe(function (identity, key, event, oldValue) {
//   console.log('callback');
//   console.log(`[${identity}] ${event}: ${oldValue} -> ${schemas[key]}`);
// });

const method = function(number) {
    return number*number;
};

Promise.resolve(10)
    .then(function(number) {
	console.log(this);
	if (this.method) {
	    console.log('entrei');
	    return this.method(number);
	}

	return number;
    }.bind({ method }))
    .then((number) => {
	console.log(number);
    });

