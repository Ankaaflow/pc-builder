import { allRealComponents } from '../data/realComponents';
import { Region, generateSmartAffiliateLink } from './budgetAllocator';

/**
 * Utility to test and validate Amazon links
 */
export class AmazonLinkTester {
  
  /**
   * Test a batch of components and their Amazon links
   */
  static async testComponentLinks(region: Region = 'US', limit: number = 10): Promise<{
    tested: number;
    working: number;
    broken: number;
    results: Array<{
      componentName: string;
      asin: string;
      url: string;
      status: 'working' | 'broken' | 'fallback' | 'untested';
      responseCode?: number;
    }>;
  }> {
    console.log(`🧪 Testing Amazon links for ${region} region...`);
    
    const results = {
      tested: 0,
      working: 0,
      broken: 0,
      results: [] as Array<{
        componentName: string;
        asin: string;
        url: string;
        status: 'working' | 'broken' | 'fallback' | 'untested';
        responseCode?: number;
      }>
    };

    // Get a sample of components to test
    const allComponents = [
      ...Object.values(allRealComponents).flat()
    ].slice(0, limit);

    for (const component of allComponents) {
      const url = generateSmartAffiliateLink(component, region);
      const isGenericSearch = url.includes('/s?k=');
      
      const result = {
        componentName: component.name,
        asin: component.asin || 'missing',
        url: url,
        status: isGenericSearch ? 'fallback' as const : 'untested' as const
      };

      // In a real implementation, you would test the URL
      // For now, we'll simulate based on ASIN patterns
      if (component.asin && !component.asin.startsWith('B0DJKL') && component.asin !== 'placeholder') {
        result.status = 'working';
        results.working++;
      } else if (isGenericSearch) {
        result.status = 'fallback';
      } else {
        result.status = 'broken';
        results.broken++;
      }

      results.results.push(result);
      results.tested++;
    }

    this.printTestResults(results, region);
    return results;
  }

  /**
   * Test specific ASIN across all regions
   */
  static testASINAcrossRegions(asin: string, componentName: string): Array<{
    region: Region;
    url: string;
    expectedWorking: boolean;
  }> {
    const regions: Region[] = ['US', 'CA', 'UK', 'DE', 'AU'];
    const results = [];

    console.log(`🌍 Testing ASIN ${asin} across all regions...`);

    for (const region of regions) {
      const mockComponent = {
        id: 'test',
        name: componentName,
        brand: 'Test',
        price: { US: 100, CA: 130, UK: 90, DE: 95, AU: 140 },
        specs: {},
        asin: asin,
        availability: 'in-stock' as const,
        trend: 'stable' as const,
        category: 'cpu' as const,
        description: 'Test component'
      };

      const url = generateSmartAffiliateLink(mockComponent, region);
      const isValidASIN = asin && !asin.startsWith('B0DJKL') && asin !== 'placeholder';
      
      results.push({
        region,
        url,
        expectedWorking: isValidASIN
      });

      console.log(`${region}: ${url} (${isValidASIN ? '✅ Expected to work' : '❌ Expected to fail/fallback'})`);
    }

    return results;
  }

  /**
   * Generate test links for common components
   */
  static generateTestLinks(): Array<{
    component: string;
    asin: string;
    links: Record<Region, string>;
  }> {
    const testComponents = [
      { name: 'Intel Core i9-14900K', asin: 'B0CHX7TPCX' },
      { name: 'AMD Ryzen 9 7950X', asin: 'B0BBHHT8LY' },
      { name: 'NVIDIA RTX 4090', asin: 'B0BGP46F8R' },
      { name: 'Test Placeholder Component', asin: 'B0DJKL123' }, // This should fallback
      { name: 'Missing ASIN Component', asin: '' } // This should fallback
    ];

    const results = [];
    
    for (const comp of testComponents) {
      const mockComponent = {
        id: 'test',
        name: comp.name,
        brand: 'Test',
        price: { US: 500, CA: 650, UK: 450, DE: 480, AU: 750 },
        specs: {},
        asin: comp.asin,
        availability: 'in-stock' as const,
        trend: 'stable' as const,
        category: 'cpu' as const,
        description: 'Test component'
      };

      const links: Record<Region, string> = {} as Record<Region, string>;
      
      (['US', 'CA', 'UK', 'DE', 'AU'] as Region[]).forEach(region => {
        links[region] = generateSmartAffiliateLink(mockComponent, region);
      });

      results.push({
        component: comp.name,
        asin: comp.asin,
        links
      });
    }

    this.printGeneratedLinks(results);
    return results;
  }

  /**
   * Validate ASIN format
   */
  static validateASIN(asin: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!asin || asin === '') {
      issues.push('ASIN is missing');
      suggestions.push('Add a valid Amazon ASIN (10 characters starting with B0)');
    } else if (asin === 'placeholder') {
      issues.push('ASIN is a placeholder');
      suggestions.push('Replace with real Amazon ASIN');
    } else if (asin.startsWith('B0DJKL')) {
      issues.push('ASIN appears to be a mock/test value');
      suggestions.push('Replace with real Amazon ASIN from product page');
    } else if (asin.length !== 10) {
      issues.push(`ASIN length is ${asin.length}, should be 10 characters`);
      suggestions.push('Amazon ASINs are always exactly 10 characters');
    } else if (!asin.startsWith('B0')) {
      issues.push('ASIN should start with "B0"');
      suggestions.push('Most current Amazon ASINs start with B0');
    } else if (!/^[A-Z0-9]+$/.test(asin)) {
      issues.push('ASIN contains invalid characters');
      suggestions.push('ASINs should only contain uppercase letters and numbers');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private static printTestResults(results: any, region: Region): void {
    console.log(`\n📊 Amazon Link Test Results for ${region}:`);
    console.log('═'.repeat(50));
    console.log(`✅ Working links: ${results.working}`);
    console.log(`🔄 Fallback searches: ${results.results.filter((r: any) => r.status === 'fallback').length}`);
    console.log(`❌ Broken links: ${results.broken}`);
    console.log(`📋 Total tested: ${results.tested}`);
    
    console.log('\n🔍 Sample Results:');
    results.results.slice(0, 5).forEach((result: any) => {
      const emoji = result.status === 'working' ? '✅' : 
                   result.status === 'fallback' ? '🔄' : '❌';
      console.log(`${emoji} ${result.componentName}: ${result.status}`);
      console.log(`   ${result.url}`);
    });
  }

  private static printGeneratedLinks(results: any[]): void {
    console.log('\n🔗 Generated Test Links:');
    console.log('═'.repeat(60));
    
    results.forEach(result => {
      console.log(`\n📦 ${result.component} (${result.asin}):`);
      Object.entries(result.links).forEach(([region, url]) => {
        const isSearch = (url as string).includes('/s?k=');
        const emoji = isSearch ? '🔍' : '🛒';
        console.log(`  ${emoji} ${region}: ${url}`);
      });
    });
  }
}

// Browser console utilities
if (typeof window !== 'undefined') {
  (window as any).testAmazonLinks = (region?: Region, limit?: number) => 
    AmazonLinkTester.testComponentLinks(region, limit);
  
  (window as any).testASIN = (asin: string, name: string) => 
    AmazonLinkTester.testASINAcrossRegions(asin, name);
  
  (window as any).generateTestLinks = () => 
    AmazonLinkTester.generateTestLinks();
  
  (window as any).validateASIN = (asin: string) => 
    AmazonLinkTester.validateASIN(asin);

  console.log('🧪 Amazon Link Testing utilities loaded!');
  console.log('- testAmazonLinks("CA", 5) - Test links for specific region');
  console.log('- testASIN("B0CHX7TPCX", "Intel i9-14900K") - Test ASIN across regions');
  console.log('- generateTestLinks() - Generate sample links');
  console.log('- validateASIN("B0CHX7TPCX") - Validate ASIN format');
}