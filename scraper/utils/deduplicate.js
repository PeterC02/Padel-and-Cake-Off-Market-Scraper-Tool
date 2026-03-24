/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Deduplicate clubs that are within 100m of each other
 */
function deduplicateClubs(clubs) {
  const unique = [];
  const DISTANCE_THRESHOLD_KM = 0.1; // 100 meters
  
  for (const club of clubs) {
    // Skip clubs without coordinates
    if (!club.latitude || !club.longitude) {
      console.warn(`   ⚠️ Skipping club without coordinates: ${club.name}`);
      continue;
    }
    
    // Find if this club is a duplicate of an existing one
    const duplicate = unique.find(u => 
      calculateDistance(u.latitude, u.longitude, club.latitude, club.longitude) < DISTANCE_THRESHOLD_KM
    );
    
    if (duplicate) {
      // Merge data from both clubs
      console.log(`   🔗 Merging: "${club.name}" with "${duplicate.name}"`);
      
      // Merge sources
      duplicate.sources = [...new Set([...duplicate.sources, ...club.sources])];
      
      // Use the most complete data
      if (!duplicate.phone && club.phone) duplicate.phone = club.phone;
      if (!duplicate.website && club.website) duplicate.website = club.website;
      if (!duplicate.address && club.address) duplicate.address = club.address;
      
      // Use higher court count
      if (club.courtCount > duplicate.courtCount) {
        duplicate.courtCount = club.courtCount;
      }
      
      // Use more complete name (longer usually means more descriptive)
      if (club.name.length > duplicate.name.length) {
        duplicate.name = club.name;
      }
      
      // Update last verified to most recent
      if (new Date(club.lastVerified) > new Date(duplicate.lastVerified)) {
        duplicate.lastVerified = club.lastVerified;
      }
    } else {
      // New unique club
      unique.push({
        ...club,
        id: generateClubId(club),
        sources: club.sources || ['unknown'],
        lastVerified: club.lastVerified || new Date().toISOString().split('T')[0]
      });
    }
  }
  
  return unique;
}

/**
 * Generate a unique ID for a club based on location and name
 */
function generateClubId(club) {
  const country = (club.country || 'unknown').toLowerCase();
  const city = (club.city || 'unknown').toLowerCase().replace(/\s+/g, '-');
  const name = club.name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  
  return `${country}-${city}-${name}`;
}

module.exports = {
  deduplicateClubs,
  calculateDistance
};
