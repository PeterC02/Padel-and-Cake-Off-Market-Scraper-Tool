#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const scrapeOSM = require('./scrapers/osm');
const { deduplicateClubs } = require('./utils/deduplicate');

async function main() {
  console.log('🏸 Quick Padel Club Scraper (OSM only)...\n');
  
  const allClubs = [];
  
  try {
    console.log('🗺️ Scraping OpenStreetMap...');
    const osmClubs = await scrapeOSM();
    console.log(`   ✅ Found ${osmClubs.length} clubs from OSM\n`);
    allClubs.push(...osmClubs);
  } catch (error) {
    console.error('   ❌ OSM scraping failed:', error.message);
    process.exit(1);
  }
  
  console.log(`📊 Total clubs: ${allClubs.length}`);
  
  // Deduplicate
  console.log('🔄 Deduplicating clubs...');
  const uniqueClubs = deduplicateClubs(allClubs);
  console.log(`   ✅ ${uniqueClubs.length} unique clubs after deduplication\n`);
  
  // Count by country
  const countryCounts = {
    UK: uniqueClubs.filter(c => c.country === 'UK').length,
    DE: uniqueClubs.filter(c => c.country === 'DE').length,
    HU: uniqueClubs.filter(c => c.country === 'HU').length,
  };
  
  // Create output JSON
  const output = {
    lastUpdated: new Date().toISOString(),
    totalClubs: uniqueClubs.length,
    countries: countryCounts,
    clubs: uniqueClubs.sort((a, b) => a.name.localeCompare(b.name))
  };
  
  // Write to file
  const outputPath = path.join(__dirname, '../data/padel-clubs.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  
  console.log('✅ Successfully wrote padel-clubs.json');
  console.log(`   📍 UK: ${countryCounts.UK} clubs`);
  console.log(`   📍 DE: ${countryCounts.DE} clubs`);
  console.log(`   📍 HU: ${countryCounts.HU} clubs`);
  console.log(`   📍 Total: ${uniqueClubs.length} clubs\n`);
  
  console.log('🎉 Scraping complete!');
}

main().catch(console.error);
