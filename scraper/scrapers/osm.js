const axios = require('axios');

/**
 * Scrape padel clubs from OpenStreetMap via Overpass API
 */
async function scrapeOSM() {
  const clubs = [];
  
  // Search regions (bounding boxes for UK, Germany, Hungary)
  const regions = [
    { name: 'UK', bbox: '49.5,-8.0,61.0,2.0', country: 'UK' },
    { name: 'Germany', bbox: '47.0,5.5,55.5,15.5', country: 'DE' },
    { name: 'Hungary', bbox: '45.5,16.0,48.5,23.0', country: 'HU' }
  ];
  
  for (const region of regions) {
    try {
      console.log(`      Searching ${region.name}...`);
      
      // Overpass query to find all padel facilities
      const query = `
        [out:json][timeout:60][bbox:${region.bbox}];
        (
          way["sport"="padel"];
          node["sport"="padel"];
          relation["sport"="padel"];
          way["leisure"="sports_centre"]["sport"~"padel"];
          node["leisure"="sports_centre"]["sport"~"padel"];
          way["name"~"padel",i];
          node["name"~"padel",i];
        );
        out center body;
      `;
      
      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(query)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 60000
        }
      );
      
      const elements = response.data.elements || [];
      console.log(`         Found ${elements.length} OSM elements`);
      
      // Process each element
      for (const el of elements) {
        const tags = el.tags || {};
        const lat = el.center?.lat || el.lat;
        const lon = el.center?.lon || el.lon;
        
        if (!lat || !lon) continue;
        
        // Skip if not actually a padel facility
        if (!tags.sport?.includes('padel') && !tags.name?.toLowerCase().includes('padel')) {
          continue;
        }
        
        const name = tags.name || tags.operator || `Padel Club (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        
        // Try to extract city from address tags
        const city = tags['addr:city'] || tags.city || extractCityFromRegion(lat, lon, region.country);
        
        clubs.push({
          name,
          latitude: lat,
          longitude: lon,
          address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city'], tags['addr:postcode']]
            .filter(Boolean).join(', ') || null,
          city,
          country: region.country,
          courtCount: 1, // OSM usually maps individual courts
          phone: tags.phone || tags['contact:phone'] || null,
          website: tags.website || tags['contact:website'] || null,
          sources: ['osm']
        });
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`      Error scraping ${region.name}:`, error.message);
    }
  }
  
  return clubs;
}

/**
 * Simple city extraction based on coordinates
 */
function extractCityFromRegion(lat, lon, country) {
  // Very basic city detection - in production, use reverse geocoding
  if (country === 'UK') {
    if (lat > 51.3 && lat < 51.7 && lon > -0.5 && lon < 0.3) return 'London';
    if (lat > 53.3 && lat < 53.6 && lon > -2.4 && lon < -2.1) return 'Manchester';
    if (lat > 52.4 && lat < 52.6 && lon > -2.0 && lon < -1.8) return 'Birmingham';
  } else if (country === 'DE') {
    if (lat > 52.3 && lat < 52.7 && lon > 13.2 && lon < 13.6) return 'Berlin';
    if (lat > 48.0 && lat < 48.3 && lon > 11.4 && lon < 11.8) return 'Munich';
    if (lat > 53.4 && lat < 53.7 && lon > 9.8 && lon < 10.2) return 'Hamburg';
  } else if (country === 'HU') {
    if (lat > 47.3 && lat < 47.7 && lon > 18.9 && lon < 19.3) return 'Budapest';
  }
  return 'Unknown';
}

module.exports = scrapeOSM;
