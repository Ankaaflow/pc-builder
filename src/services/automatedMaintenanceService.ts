// Automated Maintenance Service
// Runs scheduled tasks to validate links, extract Reddit components, and maintain database

import { componentDatabaseService } from './componentDatabaseService';
import { amazonProductMatchingService } from './amazonProductMatchingService';
import { redditComponentExtractor } from './redditComponentExtractor';
import { Region } from '../utils/budgetAllocator';

class AutomatedMaintenanceService {
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Start all automated maintenance processes
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Automated maintenance already running');
      return;
    }

    console.log('🚀 Starting automated maintenance service...');
    this.isRunning = true;

    // Schedule different maintenance tasks
    this.scheduleRedditExtraction();
    this.scheduleLinkValidation();
    this.scheduleAmazonLinkUpdates();
    this.schedulePopularityRecalculation();
    this.scheduleStatisticsReport();

    console.log('✅ All automated maintenance processes started');
  }

  /**
   * Stop all automated maintenance processes
   */
  stop(): void {
    console.log('🛑 Stopping automated maintenance service...');
    
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;

    console.log('✅ Automated maintenance stopped');
  }

  /**
   * Schedule Reddit component extraction (every 2 hours)
   */
  private scheduleRedditExtraction(): void {
    const runExtraction = async () => {
      console.log('📡 Running scheduled Reddit component extraction...');
      try {
        await redditComponentExtractor.runExtractionProcess();
      } catch (error) {
        console.error('Scheduled Reddit extraction failed:', error);
        await componentDatabaseService.logProcess('scheduled_reddit_extraction', 'failed', error.message);
      }
    };

    // Run immediately, then every 2 hours
    runExtraction();
    const interval = setInterval(runExtraction, 2 * 60 * 60 * 1000); // 2 hours
    this.intervals.push(interval);

    console.log('📅 Scheduled Reddit extraction every 2 hours');
  }

  /**
   * Schedule link validation (every 6 hours)
   */
  private scheduleLinkValidation(): void {
    const runValidation = async () => {
      console.log('🔍 Running scheduled link validation...');
      try {
        await this.validateAmazonLinks();
      } catch (error) {
        console.error('Scheduled link validation failed:', error);
        await componentDatabaseService.logProcess('scheduled_link_validation', 'failed', error.message);
      }
    };

    // Run after 30 minutes, then every 6 hours
    setTimeout(runValidation, 30 * 60 * 1000); // Initial delay
    const interval = setInterval(runValidation, 6 * 60 * 60 * 1000); // 6 hours
    this.intervals.push(interval);

    console.log('📅 Scheduled link validation every 6 hours');
  }

  /**
   * Schedule Amazon link updates (every 4 hours)
   */
  private scheduleAmazonLinkUpdates(): void {
    const runUpdate = async () => {
      console.log('🔗 Running scheduled Amazon link updates...');
      try {
        // Update links for all regions
        const regions: Region[] = ['US', 'CA', 'UK', 'DE', 'AU'];
        for (const region of regions) {
          await amazonProductMatchingService.bulkUpdateAmazonLinks(region, 20);
          // Wait between regions to avoid overwhelming APIs
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      } catch (error) {
        console.error('Scheduled Amazon link update failed:', error);
        await componentDatabaseService.logProcess('scheduled_amazon_update', 'failed', error.message);
      }
    };

    // Run after 1 hour, then every 4 hours
    setTimeout(runUpdate, 60 * 60 * 1000); // Initial delay
    const interval = setInterval(runUpdate, 4 * 60 * 60 * 1000); // 4 hours
    this.intervals.push(interval);

    console.log('📅 Scheduled Amazon link updates every 4 hours');
  }

  /**
   * Schedule popularity score recalculation (daily)
   */
  private schedulePopularityRecalculation(): void {
    const runRecalculation = async () => {
      console.log('📊 Running scheduled popularity recalculation...');
      try {
        await this.recalculateAllPopularityScores();
      } catch (error) {
        console.error('Scheduled popularity recalculation failed:', error);
        await componentDatabaseService.logProcess('scheduled_popularity_calc', 'failed', error.message);
      }
    };

    // Run daily at 2 AM (or 2 hours after startup)
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(2, 0, 0, 0);
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const initialDelay = nextRun.getTime() - now.getTime();
    
    setTimeout(() => {
      runRecalculation();
      const interval = setInterval(runRecalculation, 24 * 60 * 60 * 1000); // Daily
      this.intervals.push(interval);
    }, initialDelay);

    console.log('📅 Scheduled popularity recalculation daily at 2 AM');
  }

  /**
   * Schedule statistics report (every 12 hours)
   */
  private scheduleStatisticsReport(): void {
    const runReport = async () => {
      console.log('📈 Running scheduled statistics report...');
      try {
        await this.generateStatisticsReport();
      } catch (error) {
        console.error('Scheduled statistics report failed:', error);
        await componentDatabaseService.logProcess('scheduled_stats_report', 'failed', error.message);
      }
    };

    // Run after 2 hours, then every 12 hours
    setTimeout(runReport, 2 * 60 * 60 * 1000); // Initial delay
    const interval = setInterval(runReport, 12 * 60 * 60 * 1000); // 12 hours
    this.intervals.push(interval);

    console.log('📅 Scheduled statistics report every 12 hours');
  }

  /**
   * Validate Amazon links and mark invalid ones
   */
  private async validateAmazonLinks(): Promise<void> {
    await componentDatabaseService.logProcess('link_validation', 'started');

    try {
      const linksToValidate = await componentDatabaseService.getLinksNeedingValidation(100);
      console.log(`🔍 Validating ${linksToValidate.length} Amazon links...`);

      let validated = 0;
      let invalid = 0;

      for (const link of linksToValidate) {
        try {
          const isValid = await amazonProductMatchingService.validateAmazonLink(link);
          if (isValid) {
            validated++;
          } else {
            invalid++;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Failed to validate link ${link.asin}:`, error);
          invalid++;
        }
      }

      console.log(`✅ Link validation complete: ${validated} valid, ${invalid} invalid`);
      
      await componentDatabaseService.logProcess(
        'link_validation',
        'completed',
        `Validated ${validated} links, ${invalid} invalid`,
        { validated, invalid, total: linksToValidate.length }
      );

    } catch (error) {
      console.error('Link validation failed:', error);
      await componentDatabaseService.logProcess('link_validation', 'failed', error.message);
    }
  }

  /**
   * Recalculate popularity scores for all components
   */
  private async recalculateAllPopularityScores(): Promise<void> {
    await componentDatabaseService.logProcess('popularity_recalculation', 'started');

    try {
      const { data: components, error } = await supabase
        .from('components')
        .select('id')
        .eq('is_active', true);

      if (error || !components) {
        throw new Error(`Failed to fetch components: ${error?.message}`);
      }

      console.log(`📊 Recalculating popularity for ${components.length} components...`);

      let recalculated = 0;

      for (const component of components) {
        try {
          await componentDatabaseService.recalculatePopularityScore(component.id);
          recalculated++;
        } catch (error) {
          console.error(`Failed to recalculate popularity for ${component.id}:`, error);
        }
      }

      console.log(`✅ Popularity recalculation complete: ${recalculated} components`);
      
      await componentDatabaseService.logProcess(
        'popularity_recalculation',
        'completed',
        `Recalculated ${recalculated} components`,
        { recalculated, total: components.length }
      );

    } catch (error) {
      console.error('Popularity recalculation failed:', error);
      await componentDatabaseService.logProcess('popularity_recalculation', 'failed', error.message);
    }
  }

  /**
   * Generate and log statistics report
   */
  private async generateStatisticsReport(): Promise<void> {
    await componentDatabaseService.logProcess('statistics_report', 'started');

    try {
      const stats = await componentDatabaseService.getComponentStats();
      
      const report = {
        timestamp: new Date().toISOString(),
        database_stats: stats,
        system_health: {
          total_components: stats.total_components,
          link_health: stats.valid_links / (stats.valid_links + stats.invalid_links) * 100,
          recent_activity: stats.recent_mentions
        }
      };

      console.log('📈 System Statistics Report:');
      console.log(`   • Total Components: ${stats.total_components}`);
      console.log(`   • Valid Links: ${stats.valid_links}`);
      console.log(`   • Invalid Links: ${stats.invalid_links}`);
      console.log(`   • Link Health: ${report.system_health.link_health.toFixed(1)}%`);
      console.log(`   • Recent Mentions: ${stats.recent_mentions}`);

      await componentDatabaseService.logProcess(
        'statistics_report',
        'completed',
        'Generated system statistics',
        report
      );

    } catch (error) {
      console.error('Statistics report failed:', error);
      await componentDatabaseService.logProcess('statistics_report', 'failed', error.message);
    }
  }

  /**
   * Run manual maintenance cycle
   */
  async runManualMaintenance(): Promise<void> {
    console.log('🔧 Running manual maintenance cycle...');

    try {
      // Run all maintenance tasks sequentially
      await redditComponentExtractor.runExtractionProcess();
      await this.validateAmazonLinks();
      await amazonProductMatchingService.bulkUpdateAmazonLinks('US', 25);
      await this.recalculateAllPopularityScores();
      await this.generateStatisticsReport();

      console.log('✅ Manual maintenance cycle completed');

    } catch (error) {
      console.error('Manual maintenance failed:', error);
      await componentDatabaseService.logProcess('manual_maintenance', 'failed', error.message);
    }
  }

  /**
   * Get maintenance service status
   */
  getStatus(): {
    running: boolean;
    scheduled_tasks: number;
    uptime: number;
  } {
    return {
      running: this.isRunning,
      scheduled_tasks: this.intervals.length,
      uptime: this.isRunning ? Date.now() : 0
    };
  }

  /**
   * Emergency stop and cleanup
   */
  emergencyStop(): void {
    console.log('🚨 Emergency stop initiated...');
    this.stop();
    
    // Force cleanup
    this.intervals = [];
    this.isRunning = false;
    
    console.log('🛑 Emergency stop completed');
  }
}

export const automatedMaintenanceService = new AutomatedMaintenanceService();