# Padel Scout Scraper

Automated scraper that collects padel club data from multiple sources and outputs a unified JSON file.

## Data Sources

1. **Playtomic** - Largest padel booking platform (UK, DE, HU)
2. **OpenStreetMap** - Community-maintained geographic database
3. **LTA** - UK Lawn Tennis Association (padel section)
4. **German Padel Federation** - Official German clubs
5. **Hungarian Padel Federation** - Official Hungarian clubs

## Setup

```bash
cd scraper
npm install
```

## Usage

### Run manually
```bash
npm run scrape
```

### Test mode
```bash
npm run test
```

## Output

Generates `data/padel-clubs.json` with structure:
```json
{
  "lastUpdated": "2026-03-24T02:00:00Z",
  "totalClubs": 487,
  "countries": {
    "UK": 312,
    "DE": 128,
    "HU": 47
  },
  "clubs": [
    {
      "id": "uk-london-rocket-padel",
      "name": "Rocket Padel Battersea",
      "latitude": 51.4828,
      "longitude": -0.1426,
      "address": "Battersea Power Station, London SW11",
      "city": "London",
      "country": "UK",
      "courtCount": 6,
      "phone": "+44 20 1234 5678",
      "website": "https://www.rocketpadel.com",
      "sources": ["playtomic", "osm", "lta"],
      "lastVerified": "2026-03-24"
    }
  ]
}
```

## Automated Updates

GitHub Action runs daily at 2am UTC:
- Scrapes all sources
- Deduplicates clubs (within 100m)
- Commits updated JSON to repository

## Customization

### Add new cities
Edit `scrapers/playtomic.js` and add cities to `searchLocations`

### Add new sources
1. Create new scraper in `scrapers/`
2. Import and call in `index.js`
3. Follow the return format: `{ name, latitude, longitude, city, country, sources, ... }`

### Adjust deduplication
Edit `utils/deduplicate.js` - change `DISTANCE_THRESHOLD_KM` (default: 0.1km = 100m)

## Notes

- **Playtomic scraper** requires Puppeteer (headless browser) - may need selector updates if Playtomic changes their HTML
- **Federation scrapers** are placeholders - need actual URLs and selectors
- **Rate limiting** built-in to be respectful to source websites
- **Resilient** - if one source fails, others continue
