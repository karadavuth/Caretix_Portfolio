import { useState, useCallback } from 'react';

const PDOK_API_BASE = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1';

export function useAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // MEMOIZED: Stable function reference prevents useEffect infinite loops
  const validatePostcode = useCallback((postcode) => {
    const pattern = /^[1-9][0-9]{3}\s?[A-Z]{2}$/i;
    return pattern.test(postcode.trim());
  }, []);

  // MEMOIZED: Stable function reference
  const formatPostcode = useCallback((postcode) => {
    const clean = postcode.replace(/\s/g, '').toUpperCase();
    if (clean.length === 6) {
      return `${clean.slice(0, 4)} ${clean.slice(4)}`;
    }
    return postcode;
  }, []);

  // MEMOIZED: Stable function reference with dependencies
  const lookupAddress = useCallback(async (postcode, houseNumber) => {
    if (!postcode || !houseNumber) {
      return { success: false, error: 'Postcode en huisnummer zijn verplicht' };
    }

    if (!validatePostcode(postcode)) {
      return { success: false, error: 'Ongeldige postcode format (gebruik bijv. 1234 AB)' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
      
      // Use PDOK for real Dutch address data
      const response = await fetch(
        `${PDOK_API_BASE}/free?fq=postcode:${cleanPostcode} AND huisnummer:${houseNumber}&rows=1&fl=straatnaam,huisnummer,postcode,woonplaatsnaam,provincienaam`
      );

      if (!response.ok) {
        throw new Error(`PDOK API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.response && data.response.numFound > 0) {
        const doc = data.response.docs[0];
        
        return {
          success: true,
          address: {
            street: doc.straatnaam,
            houseNumber: doc.huisnummer.toString(),
            postalCode: formatPostcode(doc.postcode),
            city: doc.woonplaatsnaam,
            province: doc.provincienaam,
            country: 'Nederland'
          }
        };
      } else {
        return { success: false, error: 'Adres niet gevonden in PDOK database' };
      }
    } catch (err) {
      console.error('PDOK address lookup error:', err);
      setError('Adres service tijdelijk niet beschikbaar');
      return { success: false, error: 'Adres service tijdelijk niet beschikbaar' };
    } finally {
      setIsLoading(false);
    }
  }, [validatePostcode, formatPostcode]); // Dependencies for useCallback

  // MEMOIZED: Stable function reference - THIS FIXES THE INFINITE LOOP
  const suggestAddresses = useCallback(async (query) => {
    if (!query || query.length < 3) {
      return { success: true, suggestions: [] };
    }

    try {
      setIsLoading(true);
      
      // Search all Dutch addresses via PDOK
      const response = await fetch(
        `${PDOK_API_BASE}/suggest?q=${encodeURIComponent(query)}&rows=8&fl=weergavenaam,straatnaam,huisnummer,postcode,woonplaatsnaam&fq=type:adres`
      );

      if (!response.ok) {
        throw new Error(`PDOK API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response && data.response.docs) {
        const suggestions = data.response.docs.map(doc => ({
          formatted_address: doc.weergavenaam || `${doc.straatnaam} ${doc.huisnummer}, ${doc.postcode} ${doc.woonplaatsnaam}`,
          street: doc.straatnaam,
          house_number: doc.huisnummer?.toString() || '1',
          postal_code: doc.postcode,
          city: doc.woonplaatsnaam
        }));
        
        console.log(`🇳🇱 PDOK found ${suggestions.length} real Dutch addresses for "${query}"`);
        
        return { success: true, suggestions };
      }
      
      return { success: true, suggestions: [] };
    } catch (err) {
      console.error('PDOK suggestions error:', err);
      return { success: true, suggestions: [] };
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - function is stable

  return {
    lookupAddress,
    suggestAddresses,
    validatePostcode,
    formatPostcode,
    isLoading,
    error
  };
}
