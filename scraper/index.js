#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const scrapePlaytomic = require('./scrapers/playtomic');
const scrapeLTA = require('./scrapers/lta');
const scrapeGermanFederation = require('./scrapers/german-federation');
const scrapeHungarianFederation = require('./scrapers/hungarian-federation');
const scrapeOSM = require('./scrapers/osm');
const { deduplicateClubs } = require('./utils/deduplicate');

async function main() {
  console.log('🏸 Starting Padel Club Scraper...\n');
  
  const allClubs = [];
  
  // Scrape from all sources
  try {
    console.log('📱 Scraping Playtomic...');
    const playtomicClubs = await scrapePlaytomic();
    console.log(`   ✅ Found ${playtomicClubs.length} clubs from Playtomic\n`);
    allClubs.push(...playtomicClubs);
  } catch (error) {
    console.error('   ❌ Playtomic scraping failed:', error.message);
  }
  
  try {
    console.log('🎾 Scraping LTA (UK)...');
    const ltaClubs = await scrapeLTA();
    console.log(`   ✅ Found ${ltaClubs.length} clubs from LTA\n`);
    allClubs.push(...ltaClubs);
  } catch (error) {
    console.error('   ❌ LTA scraping failed:', error.message);
  }
  
  try {
    console.log('🇩🇪 Scraping German Federation...');
    const germanClubs = await scrapeGermanFederation();
    console.log(`   ✅ Found ${germanClubs.length} clubs from German Federation\n`);
    allClubs.push(...germanClubs);
  } catch (error) {
    console.error('   ❌ German Federation scraping failed:', error.message);
  }
  
  try {
    console.log('🇭🇺 Scraping Hungarian Federation...');
    const hungarianClubs = await scrapeHungarianFederation();
    console.log(`   ✅ Found ${hungarianClubs.length} clubs from Hungarian Federation\n`);
    allClubs.push(...hungarianClubs);
  } catch (error) {
    console.error('   ❌ Hungarian Federation scraping failed:', error.message);
  }
  
  try {
    console.log('🗺️ Scraping OpenStreetMap...');
    const osmClubs = await scrapeOSM();
    console.log(`   ✅ Found ${osmClubs.length} clubs from OSM\n`);
    allClubs.push(...osmClubs);
  } catch (error) {
    console.error('   ❌ OSM scraping failed:', error.message);
  }
  
  console.log(`📊 Total clubs before deduplication: ${allClubs.length}`);
  
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
