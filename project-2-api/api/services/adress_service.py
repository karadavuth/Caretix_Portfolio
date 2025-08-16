import requests
from django.conf import settings
from django.core.cache import cache
import logging
import re
from typing import Dict, List, Optional
import urllib.parse

logger = logging.getLogger(__name__)

class PDOKAddressService:
    """
    PDOK (Nederlandse Overheid) Address Service - 100% GRATIS
    Gebruikt officiële BAG/Kadaster data
    """
    
    def __init__(self):
        self.base_url = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free"
        self.suggest_url = "https://api.pdok.nl/bzk/locatieserver/suggest/v3_1/free"
    
    def validate_postcode(self, postcode: str) -> bool:
        """Validate Dutch postcode format (1234 AB)"""
        if not postcode:
            return False
        
        # Remove spaces and convert to uppercase
        clean_postcode = re.sub(r'\s+', '', postcode.upper())
        
        # Check format: 4 digits + 2 letters
        pattern = r'^[1-9][0-9]{3}[A-Z]{2}$'
        return bool(re.match(pattern, clean_postcode))
    
    def format_postcode(self, postcode: str) -> str:
        """Format postcode to standard format (1234 AB)"""
        if not postcode:
            return ""
        
        clean = re.sub(r'\s+', '', postcode.upper())
        if len(clean) == 6:
            return f"{clean[:4]} {clean[4:]}"
        return postcode
    
    def lookup_address(self, postcode: str, house_number: str, house_number_addition: str = "") -> Dict:
        """
        Lookup complete address by postcode and house number using PDOK API
        """
        try:
            # Validate input
            if not self.validate_postcode(postcode):
                return {
                    'success': False,
                    'error': 'Ongeldige postcode format'
                }
            
            if not house_number or not house_number.strip():
                return {
                    'success': False,
                    'error': 'Huisnummer is verplicht'
                }
            
            # Format postcode (remove spaces)
            clean_postcode = re.sub(r'\s+', '', postcode.upper())
            clean_house_number = house_number.strip()
            
            # Check cache first
            cache_key = f"pdok_address_{clean_postcode}_{clean_house_number}_{house_number_addition}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"Address found in cache: {cache_key}")
                return cached_result
            
            # Build query parameters
            params = {
                'fq': f'postcode:{clean_postcode}',
                'fq': f'huisnummer:{clean_house_number}',
                'rows': 1,
                'fl': 'straatnaam,huisnummer,huisnummer_toevoeging,postcode,woonplaatsnaam,provincienaam,centroide_ll'
            }
            
            # Add house number addition if provided
            if house_number_addition and house_number_addition.strip():
                params['fq'] = f'postcode:{clean_postcode} AND huisnummer:{clean_house_number} AND huisnummer_toevoeging:{house_number_addition.strip()}'
            else:
                params['fq'] = f'postcode:{clean_postcode} AND huisnummer:{clean_house_number}'
            
            logger.info(f"PDOK API request: {params}")
            
            # Make API call
            response = requests.get(self.base_url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Parse PDOK response
                if data.get('response', {}).get('numFound', 0) > 0:
                    doc = data['response']['docs'][0]
                    
                    result = {
                        'success': True,
                        'address': {
                            'street': doc.get('straatnaam', ''),
                            'house_number': str(doc.get('huisnummer', '')),
                            'house_number_addition': doc.get('huisnummer_toevoeging', ''),
                            'postal_code': self.format_postcode(doc.get('postcode', '')),
                            'city': doc.get('woonplaatsnaam', ''),
                            'province': doc.get('provincienaam', ''),
                            'country': 'Nederland',
                            'coordinates': self._parse_coordinates(doc.get('centroide_ll')),
                            'formatted_address': self._format_address(doc)
                        }
                    }
                    
                    # Cache for 24 hours
                    cache.set(cache_key, result, 60 * 60 * 24)
                    
                    logger.info(f"Address found: {result['address']['formatted_address']}")
                    return result
                else:
                    return {
                        'success': False,
                        'error': 'Adres niet gevonden'
                    }
            
            else:
                logger.error(f"PDOK API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': 'Er ging iets mis bij het opzoeken van het adres'
                }
                
        except requests.exceptions.Timeout:
            logger.error("PDOK API timeout")
            return {
                'success': False,
                'error': 'Timeout bij adres opzoeken'
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"PDOK API request error: {str(e)}")
            return {
                'success': False,
                'error': 'Netwerkfout bij adres opzoeken'
            }
        except Exception as e:
            logger.error(f"Unexpected error in address lookup: {str(e)}")
            return {
                'success': False,
                'error': 'Onverwachte fout bij adres opzoeken'
            }
    
    def suggest_addresses(self, query: str) -> Dict:
        """
        Get address suggestions based on partial input using PDOK suggest API
        """
        try:
            if len(query) < 3:
                return {
                    'success': True,
                    'suggestions': []
                }
            
            # Check cache
            cache_key = f"pdok_suggestions_{query.lower()}"
            cached_result = cache.get(cache_key)
            if cached_result:
                return cached_result
            
            # Build query parameters
            params = {
                'q': query,
                'rows': 10,
                'fq': 'type:adres',  # Only addresses
                'fl': 'weergavenaam,straatnaam,huisnummer,huisnummer_toevoeging,postcode,woonplaatsnaam,provincienaam'
            }
            
            response = requests.get(self.suggest_url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                suggestions = []
                
                for doc in data.get('response', {}).get('docs', []):
                    suggestion = {
                        'formatted_address': doc.get('weergavenaam', ''),
                        'street': doc.get('straatnaam', ''),
                        'house_number': str(doc.get('huisnummer', '')),
                        'house_number_addition': doc.get('huisnummer_toevoeging', ''),
                        'postal_code': self.format_postcode(doc.get('postcode', '')),
                        'city': doc.get('woonplaatsnaam', ''),
                        'province': doc.get('provincienaam', '')
                    }
                    suggestions.append(suggestion)
                
                result = {
                    'success': True,
                    'suggestions': suggestions
                }
                
                # Cache for 1 hour
                cache.set(cache_key, result, 60 * 60)
                
                return result
            else:
                logger.error(f"PDOK suggest API error: {response.status_code}")
                return {
                    'success': True,
                    'suggestions': []
                }
                
        except Exception as e:
            logger.error(f"Error in address suggestions: {str(e)}")
            return {
                'success': True,
                'suggestions': []
            }
    
    def _parse_coordinates(self, centroide_ll: str) -> Dict:
        """Parse coordinates from PDOK response"""
        if not centroide_ll:
            return {}
        
        try:
            # Format: "POINT(5.123456 52.123456)"
            coords = centroide_ll.replace('POINT(', '').replace(')', '').split()
            return {
                'longitude': float(coords[0]),
                'latitude': float(coords[11])
            }
        except:
            return {}
    
    def _format_address(self, doc: Dict) -> str:
        """Format address for display"""
        parts = []
        
        # Street + house number
        street = doc.get('straatnaam', '')
        house_number = doc.get('huisnummer', '')
        house_addition = doc.get('huisnummer_toevoeging', '')
        
        if street and house_number:
            street_line = f"{street} {house_number}"
            if house_addition:
                street_line += f" {house_addition}"
            parts.append(street_line)
        
        # Postal code + city
        postal_code = self.format_postcode(doc.get('postcode', ''))
        city = doc.get('woonplaatsnaam', '')
        
        if postal_code and city:
            parts.append(f"{postal_code} {city}")
        
        return ', '.join(parts)

# Updated factory function
def get_address_service():
    """
    Get PDOK address service (free government service)
    """
    return PDOKAddressService()
