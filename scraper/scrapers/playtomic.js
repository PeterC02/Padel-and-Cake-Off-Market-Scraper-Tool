const puppeteer = require('puppeteer');

/**
 * Scrape padel clubs from Playtomic
 */
async function scrapePlaytomic() {
  const clubs = [];
  
  // Major cities to search in each country
  const searchLocations = {
    UK: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Liverpool', 'Sheffield', 'Edinburgh', 'Glasgow', 'Reading', 'Oxford', 'Cambridge'],
    DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Leipzig', 'Dresden'],
    HU: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr']
  };
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    for (const [country, cities] of Object.entries(searchLocations)) {
      for (const city of cities) {
        try {
          console.log(`      Searching ${city}, ${country}...`);
          
          // Navigate to Playtomic search
          await page.goto(`https://playtomic.io/search?q=padel&location=${encodeURIComponent(city)}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
          // Wait for results to load
          await page.waitForTimeout(2000);
          
          // Extract club data from the page
          const cityClubs = await page.evaluate((currentCity, currentCountry) => {
            const results = [];
            
            // Try multiple possible selectors (Playtomic's HTML structure may vary)
            const clubCards = document.querySelectorAll('[data-testid="venue-card"], .venue-card, .club-card, .facility-card');
            
            clubCards.forEach(card => {
              try {
                // Extract name
                const nameEl = card.querySelector('[data-testid="venue-name"], .venue-name, .club-name, h3, h2');
                const name = nameEl?.textContent?.trim();
                
                if (!name || name.toLowerCase().includes('no results')) return;
                
                // Extract address
                const addressEl = card.querySelector('[data-testid="venue-address"], .venue-address, .address');
                const address = addressEl?.textContent?.trim();
                
                // Extract court count
                const courtEl = card.querySelector('[data-testid="court-count"], .court-count');
                const courtText = courtEl?.textContent || '';
                const courtCount = parseInt(courtText.match(/\d+/)?.[0]) || 1;
                
                // Try to extract coordinates from map link or data attributes
                let latitude = null;
                let longitude = null;
                
                const mapLink = card.querySelector('a[href*="maps.google.com"], a[href*="google.com/maps"]');
                if (mapLink) {
                  const href = mapLink.getAttribute('href');
                  const coordMatch = href.match(/[@,](-?\d+\.\d+),(-?\d+\.\d+)/);
                  if (coordMatch) {
                    latitude = parseFloat(coordMatch[1]);
                    longitude = parseFloat(coordMatch[2]);
                  }
                }
                
                // Check data attributes
                if (!latitude) {
                  latitude = parseFloat(card.getAttribute('data-lat') || card.getAttribute('data-latitude'));
                  longitude = parseFloat(card.getAttribute('data-lng') || card.getAttribute('data-longitude'));
                }
                
                results.push({
                  name,
                  address: address || `${currentCity}, ${currentCountry}`,
                  city: currentCity,
                  country: currentCountry,
                  courtCount,
                  latitude,
                  longitude,
                  sources: ['playtomic']
                });
              } catch (err) {
                console.error('Error parsing club card:', err);
              }
            });
            
            return results;
          }, city, country);
          
          console.log(`         Found ${cityClubs.length} clubs`);
          clubs.push(...cityClubs);
          
          // Rate limiting - be nice to Playtomic
          await page.waitForTimeout(1000);
          
        } catch (error) {
          console.error(`      Error searching ${city}:`, error.message);
        }
      }
    }
  } finally {
    await browser.close();
  }
  
  return clubs;
}

module.exports = scrapePlaytomic;
