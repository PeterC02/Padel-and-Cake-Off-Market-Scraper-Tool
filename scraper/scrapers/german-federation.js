const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape padel clubs from German Padel Federation
 * Note: This is a placeholder - needs to be updated based on actual website structure
 */
async function scrapeGermanFederation() {
  const clubs = [];
  
  try {
    console.log('      Fetching German Padel Federation directory...');
    
    // Placeholder URL - update with actual German federation website
    const response = await axios.get('https://www.padelverband.de/clubs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Parse club listings - selectors need to be updated based on actual HTML
    $('.club-item, .venue-card, .facility-listing').each((i, el) => {
      try {
        const name = $(el).find('.club-name, h3, h2').first().text().trim();
        const address = $(el).find('.address, .location').first().text().trim();
        const phone = $(el).find('.phone, .tel').first().text().trim();
        const website = $(el).find('a[href*="http"]').first().attr('href');
        
        if (name) {
          clubs.push({
            name,
            address,
            city: extractCityFromAddress(address),
            country: 'DE',
            courtCount: 1,
            phone: phone || null,
            website: website || null,
            latitude: null,
            longitude: null,
            sources: ['german_federation']
          });
        }
      } catch (err) {
        console.error('      Error parsing German club:', err.message);
      }
    });
    
    console.log(`         Found ${clubs.length} clubs from German Federation`);
    
  } catch (error) {
    console.error('      German Federation scraping failed:', error.message);
  }
  
  return clubs;
}

function extractCityFromAddress(address) {
  if (!address) return 'Unknown';
  
  const cities = ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Leipzig', 'Dresden'];
  for (const city of cities) {
    if (address.includes(city)) return city;
  }
  
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) return parts[parts.length - 2];
  
  return 'Unknown';
}

module.exports = scrapeGermanFederation;
