# crimeharvest
moves crime data from Socrata to Cloudant

### A note on timestamps

the `properties.imported` value is a JavaScript timestamp recorded in the time zone of the server, which is in the Bluemix South region, or Dallas, TX.

the `properties.timestamp` value is a JavaScript timestamp recorded in the time zone of the data provider, which is the time the crime happened in the time zone of the crime. This is convenient for single-city analysis, and makes intuitive sense. But to do time comparisons across cities you would need to shift all the `properties.timestamp` values to UTC.  
