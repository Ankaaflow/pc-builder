// Test script to verify guaranteed complete builds
import { intelligentBudgetOptimizer } from './src/services/intelligentBudgetOptimizer.js';

async function testGuaranteedBuilds() {
  console.log('🧪 Testing Guaranteed Complete Builds\n');
  
  const testBudgets = [300, 500, 800, 1200, 2000, 5000];
  const region = 'US';
  
  for (const budget of testBudgets) {
    console.log(`\n🎯 Testing Budget: $${budget}`);
    console.log('='.repeat(50));
    
    try {
      const result = await intelligentBudgetOptimizer.optimizeBuildForBudget(budget, region);
      
      console.log(`💰 Total Cost: $${result.totalCost}`);
      console.log(`📊 Budget Utilization: ${result.budgetUtilization.toFixed(1)}%`);
      console.log(`✅ Build Complete: ${result.isComplete ? 'YES' : 'NO'}`);
      console.log(`🏆 Performance Score: ${result.performanceScore}/100`);
      
      if (result.compatibilityIssues.length > 0) {
        console.log(`⚠️ Compatibility Issues: ${result.compatibilityIssues.length}`);
      }
      
      // Check all components are present
      const components = Object.entries(result.build);
      const missingComponents = components.filter(([_, component]) => component === null);
      
      if (missingComponents.length > 0) {
        console.log(`🚨 MISSING COMPONENTS: ${missingComponents.map(([cat]) => cat).join(', ')}`);
      } else {
        console.log(`✅ ALL 8 COMPONENTS PRESENT`);
        components.forEach(([category, component]) => {
          if (component) {
            console.log(`  • ${category}: ${component.name} ($${component.price[region]})`);
          }
        });
      }
      
      console.log(`📝 Notes: ${result.optimizationNotes.length} optimization notes`);
      
    } catch (error) {
      console.error(`❌ Test failed for budget $${budget}:`, error.message);
    }
  }
}

// Run tests
testGuaranteedBuilds().catch(console.error);