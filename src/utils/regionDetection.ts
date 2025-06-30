import { Region } from './budgetAllocator';

/**
 * Auto-detect user's region based on various browser and location signals
 */
export class RegionDetector {
  
  /**
   * Detect user's most likely region
   */
  static detectRegion(): Region {
    // Try multiple detection methods in order of reliability
    const region = 
      this.detectFromTimezone() ||
      this.detectFromLanguage() ||
      this.detectFromCurrency() ||
      'US'; // Default fallback

    console.log(`🌍 Auto-detected region: ${region}`);
    return region as Region;
  }

  /**
   * Detect region based on browser timezone
   */
  private static detectFromTimezone(): Region | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map common timezones to regions
      const timezoneMap: Record<string, Region> = {
        // United States
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'America/Los_Angeles': 'US',
        'America/Phoenix': 'US',
        'America/Anchorage': 'US',
        'Pacific/Honolulu': 'US',
        
        // Canada
        'America/Toronto': 'CA',
        'America/Vancouver': 'CA',
        'America/Montreal': 'CA',
        'America/Winnipeg': 'CA',
        'America/Edmonton': 'CA',
        'America/Halifax': 'CA',
        'America/St_Johns': 'CA',
        
        // United Kingdom
        'Europe/London': 'UK',
        'Europe/Dublin': 'UK',
        'Europe/Edinburgh': 'UK',
        
        // Germany
        'Europe/Berlin': 'DE',
        'Europe/Munich': 'DE',
        'Europe/Hamburg': 'DE',
        
        // Australia
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'Australia/Brisbane': 'AU',
        'Australia/Perth': 'AU',
        'Australia/Adelaide': 'AU',
        'Australia/Darwin': 'AU',
        'Australia/Hobart': 'AU'
      };

      const detectedRegion = timezoneMap[timezone];
      if (detectedRegion) {
        console.log(`🕐 Region detected from timezone (${timezone}): ${detectedRegion}`);
        return detectedRegion;
      }

      // Fallback for timezone patterns
      if (timezone.startsWith('America/')) {
        if (timezone.includes('Canada') || timezone.includes('Toronto') || timezone.includes('Vancouver')) {
          return 'CA';
        }
        return 'US';
      }
      
      if (timezone.startsWith('Europe/')) {
        if (timezone.includes('London') || timezone.includes('Dublin')) {
          return 'UK';
        }
        if (timezone.includes('Berlin') || timezone.includes('Munich')) {
          return 'DE';
        }
      }
      
      if (timezone.startsWith('Australia/')) {
        return 'AU';
      }

    } catch (error) {
      console.warn('Failed to detect timezone:', error);
    }

    return null;
  }

  /**
   * Detect region based on browser language
   */
  private static detectFromLanguage(): Region | null {
    try {
      const language = navigator.language || navigator.languages?.[0];
      
      if (!language) return null;

      // Map language codes to regions
      const languageMap: Record<string, Region> = {
        'en-US': 'US',
        'en-CA': 'CA',
        'en-GB': 'UK',
        'en-UK': 'UK',
        'de-DE': 'DE',
        'de': 'DE',
        'en-AU': 'AU'
      };

      const detectedRegion = languageMap[language];
      if (detectedRegion) {
        console.log(`🗣️ Region detected from language (${language}): ${detectedRegion}`);
        return detectedRegion;
      }

      // Fallback for language prefixes
      if (language.startsWith('en-CA')) return 'CA';
      if (language.startsWith('en-GB') || language.startsWith('en-UK')) return 'UK';
      if (language.startsWith('de')) return 'DE';
      if (language.startsWith('en-AU')) return 'AU';
      if (language.startsWith('en')) return 'US'; // Default English to US

    } catch (error) {
      console.warn('Failed to detect language:', error);
    }

    return null;
  }

  /**
   * Detect region based on number/currency formatting
   */
  private static detectFromCurrency(): Region | null {
    try {
      // Test number formatting to infer region
      const formatter = new Intl.NumberFormat();
      const testNumber = formatter.format(1234.56);
      
      // Different regions format numbers differently
      if (testNumber.includes('1,234.56')) return 'US'; // US/Canada format
      if (testNumber.includes('1 234,56')) return 'DE'; // German format
      if (testNumber.includes('1.234,56')) return 'DE'; // Alternative German format
      
      // Try currency detection
      if (typeof Intl.Locale !== 'undefined') {
        const locale = new Intl.Locale(navigator.language);
        // This is experimental and may not work in all browsers
      }

    } catch (error) {
      console.warn('Failed to detect currency format:', error);
    }

    return null;
  }

  /**
   * Get region-specific settings
   */
  static getRegionSettings(region: Region) {
    const settings = {
      US: {
        currency: 'USD',
        currencySymbol: '$',
        amazonDomain: 'amazon.com',
        priceFormat: 'en-US',
        affiliateTag: 'pcbuilder-20'
      },
      CA: {
        currency: 'CAD',
        currencySymbol: 'C$',
        amazonDomain: 'amazon.ca',
        priceFormat: 'en-CA',
        affiliateTag: 'pcbuilderCA-20'
      },
      UK: {
        currency: 'GBP',
        currencySymbol: '£',
        amazonDomain: 'amazon.co.uk',
        priceFormat: 'en-GB',
        affiliateTag: 'pcbuilder-21'
      },
      DE: {
        currency: 'EUR',
        currencySymbol: '€',
        amazonDomain: 'amazon.de',
        priceFormat: 'de-DE',
        affiliateTag: 'pcbuilder-21'
      },
      AU: {
        currency: 'AUD',
        currencySymbol: 'A$',
        amazonDomain: 'amazon.com.au',
        priceFormat: 'en-AU',
        affiliateTag: 'pcbuilderAU-20'
      }
    };

    return settings[region];
  }

  /**
   * Format price according to region
   */
  static formatPrice(price: number, region: Region): string {
    const settings = this.getRegionSettings(region);
    
    try {
      const formatter = new Intl.NumberFormat(settings.priceFormat, {
        style: 'currency',
        currency: settings.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      
      return formatter.format(price);
    } catch (error) {
      // Fallback formatting
      return `${settings.currencySymbol}${price.toLocaleString()}`;
    }
  }

  /**
   * Test if a region has good Amazon coverage
   */
  static hasAmazonSupport(region: Region): boolean {
    const supportedRegions: Region[] = ['US', 'CA', 'UK', 'DE', 'AU'];
    return supportedRegions.includes(region);
  }
}

// Expose for browser console testing
if (typeof window !== 'undefined') {
  (window as any).detectRegion = () => RegionDetector.detectRegion();
  (window as any).getRegionSettings = (region: Region) => RegionDetector.getRegionSettings(region);
  
  console.log('🌍 Region detection utilities loaded!');
  console.log('- detectRegion() - Auto-detect current region');
  console.log('- getRegionSettings("US") - Get region-specific settings');
}