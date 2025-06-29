// Autonomous System Initializer
// Starts all autonomous systems when the app loads

import { autonomousComponentDiscovery } from './autonomousComponentDiscovery';
import { realTimePriceTracker } from './realTimePriceTracker';

class AutonomousSystemInitializer {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📋 Autonomous systems already initialized');
      return;
    }

    console.log('🚀 Initializing autonomous PC component discovery system...');

    try {
      // Start component discovery system
      console.log('🔍 Starting component discovery...');
      await autonomousComponentDiscovery.discoverLatestComponents();
      
      // Start auto-update system (every 60 minutes)
      await autonomousComponentDiscovery.startAutoUpdateSystem(60);

      // Start real-time price monitoring
      console.log('💰 Starting price monitoring...');
      realTimePriceTracker.startPriceMonitoring();

      this.isInitialized = true;
      
      console.log('✅ Autonomous systems fully initialized!');
      console.log('📊 System will now:');
      console.log('   • Discover new components automatically');
      console.log('   • Update prices every 30 minutes');
      console.log('   • Scan for component releases every 60 minutes');
      console.log('   • Verify component availability in real-time');

    } catch (error) {
      console.error('❌ Failed to initialize autonomous systems:', error);
      // Don't throw - let the app continue with fallback data
    }
  }

  getStatus(): {
    initialized: boolean;
    services: {
      componentDiscovery: string;
      priceTracking: string;
      autoUpdate: string;
    };
  } {
    return {
      initialized: this.isInitialized,
      services: {
        componentDiscovery: this.isInitialized ? 'Active' : 'Inactive',
        priceTracking: this.isInitialized ? 'Active' : 'Inactive', 
        autoUpdate: this.isInitialized ? 'Active' : 'Inactive'
      }
    };
  }
}

export const autonomousSystemInitializer = new AutonomousSystemInitializer();