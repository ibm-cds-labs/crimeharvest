# crimeharvest
A NodeJS app that moves crime data from Socrata to [Cloudant](https://cloudant.com). It uses the [Socrata developer API](https://dev.socrata.com/) to query a city's crime data for recent events (depending on the city, this will be yesterday or last week's crimes), translates the responses into GeoJSON documents, then writes those documents to the Cloudant database [https://opendata.cloudant.com/crimes](https://opendata.cloudant.com/crimes). This database is open the world and can be replicated to any Cloudant, [CouchDB](http://couchdb.org) or [PouchDB](https://pouchdb.com/) instance.

A typical document in the database looks like this: 

```javascript
{
  "_id": "Philly201677006675",
  "_rev": "1-2bfee88af85b1dd922571652867eed42",
  "type": "Feature",
  "properties": {
    "compnos": "201677006675",
    "source": "Philly",
    "type": "600",
    "desc": "Thefts",
    "timestamp": 1478096160000,
    "updated": 1478210401793,
    "CDSNV": false,
    "CDSDV": false,
    "CDSSTREET": true
  }
}
```

### A note on timestamps

the `properties.imported` value is a JavaScript timestamp recorded in the time zone of the server, which is in the Bluemix South region, or Dallas, TX.

the `properties.timestamp` value is a JavaScript timestamp recorded in the time zone of the data provider, which is the time the crime happened in the time zone of the crime. This is convenient for single-city analysis, and makes intuitive sense. But to do time comparisons across cities you would need to shift all the `properties.timestamp` values to UTC.  


### UK data

In the `uk` folder is a bash shell script to import data that has been downloaded in CSV format from [https://data.police.uk/data/](https://data.police.uk/data/)

_This application is for demonstration purposes only and is in no way offering advice for safety purposes_
