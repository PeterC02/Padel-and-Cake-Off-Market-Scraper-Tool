const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape padel clubs from LTA (UK Lawn Tennis Association)
 * Note: This is a placeholder - needs to be updated based on actual LTA website structure
 */
async function scrapeLTA() {
  const clubs = [];
  
  try {
    console.log('      Fetching LTA club directory...');
    
    // LTA may have a club finder or directory page
    // This URL is a placeholder - update with actual LTA padel club directory
    const response = await axios.get('https://www.lta.org.uk/play/ways-to-play/padel/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Parse club listings - selectors need to be updated based on actual HTML structure
    $('.club-listing, .venue-card, .facility-item').each((i, el) => {
      try {
        const name = $(el).find('.club-name, .venue-name, h3, h2').first().text().trim();
        const address = $(el).find('.club-address, .address').first().text().trim();
        const phone = $(el).find('.phone, .contact-phone').first().text().trim();
        const website = $(el).find('a[href*="http"]').first().attr('href');
        
        if (name && name.toLowerCase().includes('padel')) {
          clubs.push({
            name,
            address,
            city: extractCityFromAddress(address),
            country: 'UK',
            courtCount: 1,
            phone: phone || null,
            website: website || null,
            latitude: null, // Will be geocoded later if needed
            longitude: null,
            sources: ['lta']
          });
        }
      } catch (err) {
        console.error('      Error parsing LTA club:', err.message);
      }
    });
    
    console.log(`         Found ${clubs.length} clubs from LTA`);
    
  } catch (error) {
    console.error('      LTA scraping failed:', error.message);
    // Return empty array instead of throwing - scraper should be resilient
  }
  
  return clubs;
}

function extractCityFromAddress(address) {
  if (!address) return 'Unknown';
  
  // Simple city extraction - look for common UK cities
  const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Sheffield', 'Edinburgh', 'Glasgow', 'Reading', 'Oxford', 'Cambridge'];
  for (const city of cities) {
    if (address.includes(city)) return city;
  }
  
  // Try to extract from postcode pattern
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) return parts[parts.length - 2];
  
  return 'Unknown';
}

module.exports = scrapeLTA;
