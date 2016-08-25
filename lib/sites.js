/**
 * Crime sites to be harvested should be added to the exported sites array with
 * the appropriate fields included:
 * 
 *  city: string - name of the city, region, etc. represented in the data
 *  host: string - domain hosting the data
 *  resource: string
 *  select: array of strings - the fields from the data to harvest
 *  where: function() - return the clause to filter the data
 *  process: function(site, data, mappings) - return the transformed data to be stored
 */

function categorization(mappings, field, code) {
  var map = mappings.filter(function(mapping) {
    if (code) {
      if (isNaN(code)) {
        return typeof mapping[field] === 'string' ?
                mapping[field].toUpperCase() == code.toUpperCase() :
                mapping[field] == code.toUpperCase();
      }
      else {
        return mapping[field] == code;
      }
    }
    return false;
  });

  return map.length > 0 ? map[0] : {};
}

var philly = {
  city: 'Philly',
  host: 'https://data.phila.gov', 
  resource: 'sspu-uyfa.json',
  mappingFile: 'http://ibm-cds-labs.github.io/open-data/crime/phila_ucr_codes.csv',
  select: ['dc_key', 'shape', 'dispatch_date_time', 'ucr_general', 'text_general_code'],
  where: function() {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    var todayStr = today.toISOString().slice(0, 10);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);
    return 'dispatch_date_time>="' + yesterdayStr + '" AND dispatch_date_time<"' + todayStr + '"';
  },
  process: function(site, data, mappings) {
    var newcrimes = [];
    for (var i = 0; i < data.length; i++) {
      var thecrime = data[i];
      var crimedate = new Date(thecrime.dispatch_date_time);
      var catcode = categorization(mappings, 'UCR', thecrime.ucr_general);

      // create the document to insert
      var rec = {
        _id: site.city + thecrime.dc_key, 
        type: 'Feature', 
        properties: {
          compnos: thecrime.dc_key, 
          source: site.city, 
          type: thecrime.ucr_general,
          desc: thecrime.text_general_code,  
          timestamp: crimedate.getTime(), 
          updated: Date.now(),
          CDSNV: catcode ? catcode.CDSNV == 1 : false,
          CDSDV: catcode ? catcode.CDSDV == 1 : false,
          CDSSTREET: catcode ? catcode.CDSSTREET == 1 : false
        }
      };

      // location
      if (thecrime.shape && thecrime.shape.coordinates) {
        rec.geometry = {
          type: 'Point',
          coordinates: thecrime.shape.coordinates
        };
      }

      newcrimes.push(rec);
    }
    return newcrimes;
  }
};

var chicago = {
  city: 'Chicago',
  host: 'https://data.cityofchicago.org/',
  resource: '6zsd-86xi.json',
  mappingFile: 'http://ibm-cds-labs.github.io/open-data/crime/chicago_iucr_codes.csv',
  select: ['id', 'location', 'date', 'primary_type', 'fbi_code', 'iucr', 'description'],
  where: function() {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 8);
    var todayStr = today.toISOString().slice(0, 10);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);
    return 'date>="' + yesterdayStr + '" AND date<"' + todayStr + '"';
  },
  process: function(site, data, mappings) {
    var newcrimes = [];
    for (var i = 0; i < data.length; i++) {
      var thecrime = data[i];
      var crimedate = new Date(thecrime.date);
      var catcode = categorization(mappings, 'IUCR', thecrime.iucr);

      // create the document to insert
      var rec = {
        _id: site.city + thecrime.id, 
        type: 'Feature', 
        properties: {
          compnos: thecrime.id, 
          source: site.city, 
          type: thecrime.fbi_code,
          iucr: thecrime.iucr, 
          desc: thecrime.primary_type + '>' + thecrime.description,  
          timestamp: crimedate.getTime(), 
          updated: Date.now(),
          CDSNV: catcode ? catcode.CDSNV == 1 : false,
          CDSDV: catcode ? catcode.CDSDV == 1 : false,
          CDSSTREET: catcode ? catcode.CDSSTREET == 1 : false
        }
      };

      // location
      if (thecrime.location && thecrime.location.coordinates) {
        rec.geometry = {
          type: 'Point',
          coordinates: thecrime.location.coordinates
        };
      }

      newcrimes.push(rec);
    }
    return newcrimes;
  }
};

var batonrouge = {
  city: 'BatonRouge',
  host: 'https://data.brla.gov/', 
  resource: '5rji-ddnu.json',
  mappingFile: 'http://ibm-cds-labs.github.io/open-data/crime/batonrouge_categories.csv',
  select: ['file_number', 'geolocation', 'offense_date', 'offense_time', 'crime', 'offense'],
  where: function() {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    var todayStr = today.toISOString().slice(0, 10);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);
    return 'offense_date>="' + yesterdayStr + '" AND offense_date<"' + todayStr + '"';
  },
  process: function(site, data, mappings) {
    var newcrimes = [];
    for (var i = 0; i < data.length; i++) {
      var thecrime = data[i];
      var crimedate = new Date(thecrime.offense_date);
      if (thecrime.offense_time && thecrime.offense_time.length > 3) {
        var h = thecrime.offense_time.substring(0, 2);
        var m = thecrime.offense_time.substring(2);
        crimedate.setHours(parseInt(h), parseInt(m));
      }
      var catcode = categorization(mappings, 'CRIME', thecrime.crime);

      // create the document to insert
      var rec = {
        _id: site.city + thecrime.file_number, 
        type: 'Feature', 
        properties: {
          compnos: thecrime.file_number, 
          source: site.city, 
          type: thecrime.crime,
          desc: thecrime.offense_desc,  
          timestamp: crimedate.getTime(), 
          updated: Date.now(),
          CDSNV: catcode ? catcode.CDSNV == 1 : false,
          CDSDV: catcode ? catcode.CDSDV == 1 : false,
          CDSSTREET: catcode ? catcode.CDSSTREET == 1 : false
        }
      };

      // location
      if (thecrime.geolocation && thecrime.geolocation.coordinates) {
        rec.geometry = {
          type: 'Point',
          coordinates: thecrime.geolocation.coordinates
        };
      }

      newcrimes.push(rec);
    }
    return newcrimes;
  }
};

var sf = {
  city: 'SF',
  host: 'https://data.sfgov.org', 
  resource: 'tmnf-yvry.json',
  mappingFile: 'http://ibm-cds-labs.github.io/open-data/crime/SF_categories.csv',
  select: ['incidntnum', 'category', 'date', 'time', 'x', 'y'],
  where: function() {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 14);
    var todayStr = today.toISOString().slice(0, 10);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);
    return 'date>="' + yesterdayStr + '" AND date<"' + todayStr + '"';
  },
  process: function(site, data, mappings) {
    var newcrimes = [];
    for (var i = 0; i < data.length; i++) {
      var thecrime = data[i];
      var crimedate = new Date(thecrime.date);
      var hm = thecrime.time.split(':');
      crimedate.setHours(parseInt(hm[0]), parseInt(hm[1]));
      var catcode = categorization(mappings, 'Category', thecrime.category);

      // create the document to insert
      var rec = {
        _id: site.city + thecrime.incidntnum, 
        type: 'Feature', 
        properties: {
          compnos: thecrime.incidntnum, 
          source: site.city, 
          type: thecrime.category,
          desc: thecrime.descript,
          timestamp: crimedate.getTime(), 
          updated: Date.now(),
          CDSNV: catcode ? catcode.CDSNV == 1 : false,
          CDSDV: catcode ? catcode.CDSDV == 1 : false,
          CDSSTREET: catcode ? catcode.CDSSTREET == 1 : false
        }
      };

      // location
      var lon = thecrime.x;
      var lat = thecrime.y;
      if ( lon && lat ) {
        lon = parseFloat(lon);
        lat = parseFloat(lat);
        if ( lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90 ) {
            rec.geometry = {
              type: 'Point',
              coordinates: [lon, lat]
            };
        }
      }
      else {
        console.error('LOCS: '+locs.toString());
      }

      newcrimes.push(rec);
    }
    return newcrimes;
  }
};

var boston = {
  city: 'Boston',
  host: 'https://data.cityofboston.gov', 
  resource: '29yf-ye7n',
  mappingFile: 'http://ibm-cds-labs.github.io/open-data/crime/boston_ucr_codes.csv',
  select: ['incident_number','offense_code','offense_code_group','offense_description','district','reporting_area','shooting','occurred_on_date','year','month','day_of_week','ucr_part','street','lat','long'],
  where: function() {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    var todayStr = today.toISOString().slice(0, 10);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);
    return 'occurred_on_date>="' + yesterdayStr + '" AND occurred_on_date<"' + todayStr + '"';
  },
  process: function(site, data, mappings) {
    var newcrimes = [];
    for (var i = 0; i < data.length; i++) {
      var thecrime = data[i];
      var crimedate = new Date(thecrime.occurred_on_date);
      var ucr_general = parseInt(thecrime.offense_code);
      var catcode = categorization(mappings, 'ucr_minus2digits', ucr_general);
      if ( !catcode || !catcode.CDSNV ) {
        ucr_general = parseInt( thecrime.offense_code.substr(0, 3) );
        catcode = categorization(mappings, 'ucr_minus2digits', ucr_general);
      }
      // console.log("catcode for " + ucr_general + ": ");
      // console.log(catcode);

      // create the document to insert
      var rec = {
        _id: site.city + thecrime.incident_number, 
        type: 'Feature', 
        properties: {
          incident_number: thecrime.incident_number, 
          offense_code: thecrime.offense_code,
          offense_code_group: thecrime.offense_code_group,
          offense_description: thecrime.offense_description,
          district: thecrime.district,
          reporting_area: thecrime.reporting_area,
          shooting: thecrime.shooting,
          occurred_on_date: thecrime.occurred_on_date,
          year: thecrime.year,
          month: thecrime.month,
          day_of_week: thecrime.day_of_week,
          ucr_part: thecrime.ucr_part,
          street: thecrime.street,
          source: site.city, 
          timestamp: crimedate.getTime(), 
          updated: Date.now(),
          type: thecrime.offense_code,
          desc: thecrime.offense_description,
          CDSNV: catcode ? catcode.CDSNV == 1 : false,
          CDSDV: catcode ? catcode.CDSDV == 1 : false,
          CDSSTREET: catcode ? catcode.CDSSTREET == 1 : false
        }
      };

      // location
      if (thecrime.lat && thecrime.long) {
        rec.geometry = {
          type: 'Point',
          coordinates: [ parseFloat(thecrime.long), parseFloat(thecrime.lat) ]
        };
      }

      newcrimes.push(rec);
    }
    return newcrimes;
  }
};


module.exports = [philly, chicago, batonrouge, sf, boston];
