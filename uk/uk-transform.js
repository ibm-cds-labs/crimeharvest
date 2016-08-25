var x = function (doc) { 
  doc['type'] = 'Feature';
  doc['properties'] = {};
  doc['geometry'] = {};

  if ( doc['Crime ID']) {
    doc['properties']['compnos'] = doc['Crime ID'];
  }
  delete doc['Crime ID'];

  if (doc['Month']) {
    ds = doc['Month'].split('-');
    crimedate = new Date( parseInt(ds[0]), parseInt(ds[1]) );
    doc['properties']['timestamp'] = crimedate.getTime();
    delete doc['Month'];
  }
  doc['properties']['updated'] = Date.now();

  doc['properties']['source'] = 'UK-' + doc['Falls within'];
  delete doc['Falls within'];

  doc['properties']['type'] = doc['Crime type'];
  delete doc['Crime type'];

  // location
  if (doc['Location']) {
    doc['properties']['location'] = doc['Location'];
    delete doc['Location'];
  }
  var lon = doc['Longitude'];
  var lat = doc['Latitude'];
  if ( lon && lat ) {
    lon = parseFloat(lon);
    lat = parseFloat(lat);
    if ( lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90 )
      doc['geometry'] = { type: "Point", coordinates: [ lon, lat ]};
  } else {
    console.error("Bad location");
  }

  // delete doc['Reported by'];
  delete doc['Longitude'];
  delete doc['Latitude'];
  delete doc['LSOA code'];
  delete doc['LSOA name'];
  delete doc['Last outcome category'];
  delete doc['Context'];
  

  return doc;
}

module.exports = x;