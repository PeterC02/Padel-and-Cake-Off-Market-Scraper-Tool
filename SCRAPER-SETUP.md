# 🏸 Padel Scout - Scraper Setup Guide

## ✅ What's Been Built

A **100% free, zero-API** scraping infrastructure that:
- Scrapes padel clubs from **5 sources** (Playtomic, OSM, LTA, German/Hungarian federations)
- Deduplicates clubs within 100m radius
- Outputs static JSON file (`data/padel-clubs.json`)
- Runs **daily at 2am UTC** via GitHub Actions (free)
- Auto-commits updates to repository
- Hosted on GitHub raw URL (free CDN)

## 📁 File Structure

```
padel-scout/
├── data/
│   └── padel-clubs.json          # Auto-generated daily
├── scraper/
│   ├── package.json
│   ├── index.js                  # Main orchestrator
│   ├── scrapers/
│   │   ├── playtomic.js         # ⭐ Primary source
│   │   ├── osm.js               # Fallback source
│   │   ├── lta.js               # UK federation (placeholder)
│   │   ├── german-federation.js # DE federation (placeholder)
│   │   └── hungarian-federation.js # HU federation (placeholder)
│   └── utils/
│       └── deduplicate.js       # Merge duplicate clubs
└── .github/workflows/
    └── scrape-clubs.yml         # Daily cron job
```

## 🚀 Next Steps

### 1. Test the Scraper Locally

```bash
cd scraper
npm install
node index.js
```

This will:
- Scrape Playtomic (may take 5-10 minutes)
- Scrape OSM (2-3 minutes)
- Try federation scrapers (will fail - need URLs)
- Output `data/padel-clubs.json`

### 2. Customize Federation Scrapers

The federation scrapers are **placeholders**. You need to:

1. Find the actual club directory URLs:
   - UK LTA: https://www.lta.org.uk/... (find padel section)
   - German: https://www.padelverband.de/... (find club list)
   - Hungarian: https://www.magyarpadel.hu/... (find club list)

2. Update the scrapers with correct:
   - URLs
   - CSS selectors (inspect the HTML)
   - Data extraction logic

### 3. Enable GitHub Action

The scraper will run automatically daily at 2am UTC. To trigger manually:
1. Go to GitHub repo → Actions tab
2. Click "Scrape Padel Clubs" workflow
3. Click "Run workflow"

### 4. Update Padel Scout App

**Next task**: Modify `src/App.jsx` to:
- Fetch from `https://raw.githubusercontent.com/PeterC02/Padel-and-Cake-Off-Market-Scraper-Tool/main/data/padel-clubs.json`
- Cache in browser
- Fall back to OSM if fetch fails

## 🔧 Troubleshooting

### Playtomic scraper fails
- Playtomic may have changed their HTML structure
- Open https://playtomic.io in browser, inspect club cards
- Update selectors in `scrapers/playtomic.js`

### No coordinates extracted
- Playtomic may not expose coordinates in HTML
- May need to use geocoding API (Nominatim is free)
- Or extract from embedded Google Maps links

### GitHub Action fails
- Check Actions tab for error logs
- May need to install Chromium for Puppeteer:
  ```yaml
  - name: Install Chromium
    run: sudo apt-get install -y chromium-browser
  ```

## 📊 Expected Output

After first run, `data/padel-clubs.json` should contain:
- **UK**: 200-400 clubs (Playtomic + OSM + LTA)
- **Germany**: 100-200 clubs (Playtomic + OSM + Federation)
- **Hungary**: 30-60 clubs (Playtomic + OSM + Federation)

## 🎯 Benefits

✅ **No API costs** - 100% free scraping
✅ **No backend** - static JSON file
✅ **Auto-updates** - daily GitHub Action
✅ **Fast loading** - JSON cached in browser
✅ **Comprehensive** - multiple sources merged
✅ **Resilient** - if one source fails, others work

## ⚠️ Legal Note

Web scraping is legal for publicly available data, but:
- Be respectful (rate limiting built-in)
- Don't overload servers
- Check robots.txt
- For commercial use, consider contacting data sources
