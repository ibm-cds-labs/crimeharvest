var Cloudant = require('cloudant');
var CronJob = require('cron').CronJob;
var Socrata = require('node-socrata');
var nodemailer = require("nodemailer");
var dotenv = require('dotenv');
dotenv.config(); // load environment variables

const SOCRATA_MAX_RECORDS = 50000;

//-- Cloudant settings
var password = process.env.CLOUDANTPASSWORD || process.argv[4];
var dbuser = process.env.CLOUDANTUSER || process.argv[3]; //'rajsingh'; // Set this to your own account
var dbname = process.env.CLOUDANTDB || process.argv[2]; //'crimes';
//-- end Cloudant

//-- mail settings
var mailhost = process.env.MAILHOST;
var mailuser = process.env.MAILUSER;
var mailpw = process.env.MAILPW;
var smtpTransport = nodemailer.createTransport({
   service: "a2",
   host: mailhost,
   port: 465, 
   secure: true,  
   auth: {
       user: mailuser,
       pass: mailpw
   }, 
   tls: {
        rejectUnauthorized: false // do not fail on invalid certs
    }
});

var sites = require('./lib/sites.js');
var Converter = require('csvtojson').Converter;
var request = require('request');

//-- Repeating job to send messages
var thejob = new CronJob('00 00 03 * * *', harvestCrimes); // every day at 3am GMT
thejob.start();

function harvestCrimes() {
	if (sites && sites.length > 0) {
		console.log('Harvesting crimes from %d location(s)', sites.length);

		Cloudant({ account: dbuser, password: password }, function(err, cloudant) {
			if (err) {
				console.error('Error connecting to Cloudant account:', err.message);
			}
			else {
				console.log('Connecting with Cloudant db:', dbname);
				// specify the database we are going to use
				var thedb = cloudant.db.use(dbname); 

				sites.forEach(function(site, index) {
					fetchCrimeMappings(site, thedb);
				});
			}
		}); //end Cloudant connect
	}
	else {
		console.warn('No sites found or available for harvesting');
	}
}

function fetchCrimeMappings(site, thedb) {
	console.log('Fetching %s crime mappings...', site.city);

  var converter = new Converter({});
  converter.on('end_parsed', function (mappings) {
		harvestCrimeData(site, thedb, mappings)
  }); //end csvtojson converter

  request.get(site.mappingFile).pipe(converter);
}

function harvestCrimeData(site, thedb, mappings) {
		console.log('Fetching %s crime data...', site.city);

		// Configure the where clause
		var where = site.where();

		var params = { 
			$select: site.select, 
			$where: where, 
			$limit: SOCRATA_MAX_RECORDS
		};

		var soda = new Socrata({
			hostDomain: site.host,
			resource: site.resource
		});

		soda.get(params, function(connecterr, response, data) {
			if (connecterr) {
				logMessage(site.city, connecterr);
				console.log(connecterr);
			}
			else {
				// Even if we get data back, let's run through some sanity checks
				var mincrimes = 15;
				if ( data.length < mincrimes) logMessage(site.city, 'POSSIBLE ERROR: less than ' + mincrimes + ' found for day ' + where);

				var newcrimes = site.process(site, data, mappings);

				thedb.bulk({ 'docs': newcrimes }, null, function(error, body) {
					if (error) {
						logMessage(site.city, 'Error writing new crimes: ' + error);
						msg = {
							subject:'crimeharvest error', 
							text: "City: " + site.city + "\n\n" + error
						};
						mailRaj(msg);
					}
				});

				logMessage(site.city, 'SUCCESSFULLY inserted ' + newcrimes.length + ' new crimes: ' + where);
			}
		}); //end soda get

}

function logMessage(cityname, messageinfo) {
	var msg = {
		time: new Date().getTime(),
		text: cityname + ': ' + messageinfo.toString(),
		subject: 'app: crimeharvest log message'
	};
	console.log(JSON.stringify(msg));
	// send Raj an email
	mailRaj(msg);

	Cloudant({account:dbuser, password:password}, function(er, cloudant) {
		var logdb = cloudant.db.use(dbname+'_log');
		logdb.insert(msg, function (err2, body) {
			if (err2) console.log('Error writing error to ' + dbname+'_log: ' + err2);
		});
	});
}

function mailRaj(msgobj) {
	var mail = {
		from: mailuser,
		to: "rrsingh@us.ibm.com",
		subject: msgobj.subject,
		text: msgobj.text ? msgobj.text : "",
		html: msgobj.html ? msgobj.html : ""
	};

	smtpTransport.sendMail(mail, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.log('Message %s sent: %s', info.messageId, info.response);
	});
}

// it seems that cf apps don't like it if they ever exit, so listen like a web server for no reason
var express = require('express');
var app = express();
app.set('title', 'crimeharvest');
// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = ('0.0.0.0' || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.PORT || 8080);
// Start server
app.listen(port, host);
