import { allRealComponents } from '../data/realComponents';
import { allComponents } from '../data/components';
import { amazonProductMatcher } from '../services/amazonProductMatcher';
import { Region } from './budgetAllocator';

/**
 * Utility for validating and updating ASINs across all components
 */
export class ASINValidator {
  
  /**
   * Validate all component ASINs and report issues
   */
  async validateAllASINs(region: Region = 'US'): Promise<{
    valid: number;
    invalid: number;
    updated: number;
    issues: string[];
  }> {
    console.log('🔍 Starting comprehensive ASIN validation...');
    
    const results = {
      valid: 0,
      invalid: 0,
      updated: 0,
      issues: [] as string[]
    };

    // Get all components from all data sources
    const allComponentsFlat = [
      ...Object.values(allComponents).flat(),
      ...Object.values(allRealComponents).flat()
    ];

    // Remove duplicates by name
    const uniqueComponents = allComponentsFlat.filter((component, index, arr) => 
      arr.findIndex(c => c.name === component.name) === index
    );

    console.log(`📊 Validating ${uniqueComponents.length} unique components...`);

    for (const component of uniqueComponents) {
      try {
        await this.validateSingleComponent(component, region, results);
        
        // Rate limiting to avoid overwhelming Amazon API
        await this.delay(300); // 300ms between requests
        
      } catch (error) {
        results.invalid++;
        results.issues.push(`❌ ${component.name}: ${error}`);
      }
    }

    this.printValidationReport(results);
    return results;
  }

  /**
   * Find components with placeholder or missing ASINs
   */
  async findProblematicASINs(): Promise<{
    placeholder: string[];
    missing: string[];
    suspicious: string[];
  }> {
    const allComponentsFlat = [
      ...Object.values(allComponents).flat(),
      ...Object.values(allRealComponents).flat()
    ];

    const uniqueComponents = allComponentsFlat.filter((component, index, arr) => 
      arr.findIndex(c => c.name === component.name) === index
    );

    const placeholder: string[] = [];
    const missing: string[] = [];
    const suspicious: string[] = [];

    for (const component of uniqueComponents) {
      if (!component.asin || component.asin === '') {
        missing.push(component.name);
      } else if (component.asin === 'placeholder' || component.asin.startsWith('B0DJKL')) {
        placeholder.push(component.name);
      } else if (component.asin.length !== 10 || !component.asin.startsWith('B0')) {
        suspicious.push(component.name);
      }
    }

    console.log('🔍 ASIN Analysis Results:');
    console.log(`📦 Placeholder ASINs: ${placeholder.length}`);
    console.log(`❓ Missing ASINs: ${missing.length}`);
    console.log(`⚠️  Suspicious ASINs: ${suspicious.length}`);

    return { placeholder, missing, suspicious };
  }

  /**
   * Auto-fix components with known issues
   */
  async autoFixASINs(region: Region = 'US'): Promise<{
    fixed: number;
    failed: number;
    suggestions: Array<{
      componentName: string;
      oldASIN: string;
      newASIN: string;
      confidence: number;
    }>;
  }> {
    console.log('🔧 Starting auto-fix for problematic ASINs...');
    
    const { placeholder, missing, suspicious } = await this.findProblematicASINs();
    const problematicComponents = [...placeholder, ...missing, ...suspicious];
    
    const results = {
      fixed: 0,
      failed: 0,
      suggestions: [] as Array<{
        componentName: string;
        oldASIN: string;
        newASIN: string;
        confidence: number;
      }>
    };

    // Get all components
    const allComponentsFlat = [
      ...Object.values(allComponents).flat(),
      ...Object.values(allRealComponents).flat()
    ];

    for (const componentName of problematicComponents) {
      const component = allComponentsFlat.find(c => c.name === componentName);
      if (!component) continue;

      try {
        const amazonMatch = await amazonProductMatcher.findBestMatch(component, region);
        
        if (amazonMatch) {
          const confidence = this.calculateMatchConfidence(component.name, amazonMatch.title);
          
          results.suggestions.push({
            componentName: component.name,
            oldASIN: component.asin || 'missing',
            newASIN: amazonMatch.asin,
            confidence
          });

          if (confidence > 0.8) {
            results.fixed++;
          } else {
            results.failed++;
          }
        } else {
          results.failed++;
        }

        await this.delay(500); // Longer delay for auto-fix

      } catch (error) {
        results.failed++;
        console.warn(`Failed to auto-fix ${componentName}:`, error);
      }
    }

    this.printAutoFixReport(results);
    return results;
  }

  private async validateSingleComponent(
    component: any, 
    region: Region, 
    results: any
  ): Promise<void> {
    // Check if ASIN exists and is valid format
    if (!component.asin || component.asin === 'placeholder' || component.asin.startsWith('B0DJKL')) {
      results.invalid++;
      results.issues.push(`🔶 ${component.name}: Has placeholder/missing ASIN (${component.asin || 'missing'})`);
      return;
    }

    // Try to verify ASIN with Amazon
    const amazonProduct = await amazonProductMatcher.getProductByASIN(component.asin, region);
    
    if (!amazonProduct) {
      results.invalid++;
      results.issues.push(`❌ ${component.name}: ASIN ${component.asin} not found on Amazon`);
      return;
    }

    // Check if product title matches component name
    const isGoodMatch = this.calculateMatchConfidence(component.name, amazonProduct.title) > 0.7;
    
    if (!isGoodMatch) {
      results.invalid++;
      results.issues.push(`⚠️  ${component.name}: ASIN ${component.asin} points to different product: "${amazonProduct.title}"`);
      
      // Try to find a better match
      const betterMatch = await amazonProductMatcher.findBestMatch(component, region);
      if (betterMatch && betterMatch.asin !== component.asin) {
        results.issues.push(`💡 Suggested ASIN for ${component.name}: ${betterMatch.asin} (${betterMatch.title})`);
        results.updated++;
      }
      return;
    }

    results.valid++;
  }

  private calculateMatchConfidence(componentName: string, productTitle: string): number {
    const normalizeString = (str: string) => 
      str.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();

    const normalizedComponent = normalizeString(componentName);
    const normalizedTitle = normalizeString(productTitle);

    const componentTerms = normalizedComponent.split(' ');
    const titleTerms = normalizedTitle.split(' ');

    let matchedTerms = 0;
    for (const term of componentTerms) {
      if (term.length > 2 && titleTerms.some(titleTerm => titleTerm.includes(term))) {
        matchedTerms++;
      }
    }

    return matchedTerms / componentTerms.length;
  }

  private printValidationReport(results: any): void {
    console.log('\n📊 ASIN Validation Report:');
    console.log('═'.repeat(50));
    console.log(`✅ Valid ASINs: ${results.valid}`);
    console.log(`❌ Invalid ASINs: ${results.invalid}`);
    console.log(`🔄 Updated suggestions: ${results.updated}`);
    console.log(`📋 Total issues: ${results.issues.length}`);
    
    if (results.issues.length > 0) {
      console.log('\n🔍 Detailed Issues:');
      results.issues.slice(0, 10).forEach(issue => console.log(issue));
      
      if (results.issues.length > 10) {
        console.log(`... and ${results.issues.length - 10} more issues`);
      }
    }
  }

  private printAutoFixReport(results: any): void {
    console.log('\n🔧 Auto-Fix Report:');
    console.log('═'.repeat(40));
    console.log(`✅ Fixed: ${results.fixed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`💡 Suggestions: ${results.suggestions.length}`);
    
    if (results.suggestions.length > 0) {
      console.log('\n📋 Top Suggestions:');
      results.suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .forEach(suggestion => {
          console.log(`${suggestion.componentName}:`);
          console.log(`  Old: ${suggestion.oldASIN}`);
          console.log(`  New: ${suggestion.newASIN}`);
          console.log(`  Confidence: ${Math.round(suggestion.confidence * 100)}%`);
        });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const asinValidator = new ASINValidator();

// Console commands for easy access
if (typeof window !== 'undefined') {
  (window as any).validateASINs = () => asinValidator.validateAllASINs();
  (window as any).findBadASINs = () => asinValidator.findProblematicASINs();
  (window as any).autoFixASINs = () => asinValidator.autoFixASINs();
  
  console.log('🛠️  ASIN Validation utilities loaded! Try:');
  console.log('- validateASINs() - Check all ASINs');
  console.log('- findBadASINs() - Find problematic ASINs');
  console.log('- autoFixASINs() - Auto-fix issues');
}