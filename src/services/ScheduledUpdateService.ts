
import { componentScrapingService } from './ComponentScrapingService';

export interface UpdateSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  lastRun: Date | null;
  nextRun: Date;
  isActive: boolean;
}

export interface UpdateResult {
  timestamp: Date;
  success: boolean;
  componentsAdded: number;
  componentsUpdated: number;
  componentsRemoved: number;
  errors: string[];
  executionTime: number;
}

export class ScheduledUpdateService {
  private schedules: UpdateSchedule[] = [];
  private updateHistory: UpdateResult[] = [];
  private isRunning: boolean = false;

  constructor() {
    this.initializeDefaultSchedules();
  }

  // Initialize default update schedules
  private initializeDefaultSchedules() {
    const now = new Date();
    
    this.schedules = [
      {
        id: 'price-updates',
        name: 'Price Updates',
        frequency: 'hourly',
        lastRun: null,
        nextRun: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        isActive: true
      },
      {
        id: 'component-discovery',
        name: 'Component Discovery',
        frequency: 'daily',
        lastRun: null,
        nextRun: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        isActive: true
      },
      {
        id: 'reddit-recommendations',
        name: 'Reddit Recommendations',
        frequency: 'daily',
        lastRun: null,
        nextRun: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        isActive: true
      },
      {
        id: 'new-product-detection',
        name: 'New Product Detection',
        frequency: 'weekly',
        lastRun: null,
        nextRun: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true
      }
    ];
  }

  // Start the scheduled update service
  start() {
    if (this.isRunning) {
      console.log('Scheduled update service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting scheduled update service...');
    
    // Check for due updates every 5 minutes
    setInterval(() => {
      this.checkAndRunDueUpdates();
    }, 5 * 60 * 1000);

    console.log('Scheduled update service started');
  }

  // Stop the scheduled update service
  stop() {
    this.isRunning = false;
    console.log('Scheduled update service stopped');
  }

  // Check for and run due updates
  private async checkAndRunDueUpdates() {
    const now = new Date();
    
    for (const schedule of this.schedules) {
      if (schedule.isActive && schedule.nextRun <= now) {
        await this.runScheduledUpdate(schedule);
      }
    }
  }

  // Run a specific scheduled update
  private async runScheduledUpdate(schedule: UpdateSchedule) {
    const startTime = Date.now();
    console.log(`Running scheduled update: ${schedule.name}`);

    try {
      let result: UpdateResult;

      switch (schedule.id) {
        case 'price-updates':
          result = await this.runPriceUpdates();
          break;
        case 'component-discovery':
          result = await this.runComponentDiscovery();
          break;
        case 'reddit-recommendations':
          result = await this.runRedditRecommendations();
          break;
        case 'new-product-detection':
          result = await this.runNewProductDetection();
          break;
        default:
          throw new Error(`Unknown schedule type: ${schedule.id}`);
      }

      result.executionTime = Date.now() - startTime;
      this.updateHistory.push(result);

      // Update schedule for next run
      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(schedule);

      console.log(`Completed scheduled update: ${schedule.name} in ${result.executionTime}ms`);

    } catch (error) {
      console.error(`Error in scheduled update ${schedule.name}:`, error);
      
      const errorResult: UpdateResult = {
        timestamp: new Date(),
        success: false,
        componentsAdded: 0,
        componentsUpdated: 0,
        componentsRemoved: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        executionTime: Date.now() - startTime
      };
      
      this.updateHistory.push(errorResult);
      
      // Still update the schedule for next run
      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(schedule);
    }
  }

  // Calculate next run time based on frequency
  private calculateNextRun(schedule: UpdateSchedule): Date {
    const now = new Date();
    
    switch (schedule.frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Run price updates
  private async runPriceUpdates(): Promise<UpdateResult> {
    console.log('Running price updates...');
    
    // Simulated price update process
    const updateResult = await componentScrapingService.updateComponentDatabase();
    
    return {
      timestamp: new Date(),
      success: updateResult.errors.length === 0,
      componentsAdded: 0,
      componentsUpdated: Math.floor(Math.random() * 50) + 10, // Simulated updates
      componentsRemoved: 0,
      errors: updateResult.errors,
      executionTime: 0
    };
  }

  // Run component discovery
  private async runComponentDiscovery(): Promise<UpdateResult> {
    console.log('Running component discovery...');
    
    const updateResult = await componentScrapingService.updateComponentDatabase();
    
    return {
      timestamp: new Date(),
      success: updateResult.errors.length === 0,
      componentsAdded: updateResult.added,
      componentsUpdated: updateResult.updated,
      componentsRemoved: updateResult.removed,
      errors: updateResult.errors,
      executionTime: 0
    };
  }

  // Run Reddit recommendations update
  private async runRedditRecommendations(): Promise<UpdateResult> {
    console.log('Running Reddit recommendations update...');
    
    try {
      const subreddits = ['buildapc', 'buildmeapc', 'pcmasterrace'];
      let totalRecommendations = 0;
      
      for (const subreddit of subreddits) {
        const posts = await componentScrapingService.getRedditRecommendations(subreddit, 'best components');
        const recommendations = await componentScrapingService.parseRedditRecommendations(posts);
        totalRecommendations += recommendations.length;
        
        console.log(`Found ${recommendations.length} recommendations from r/${subreddit}`);
      }
      
      return {
        timestamp: new Date(),
        success: true,
        componentsAdded: 0,
        componentsUpdated: totalRecommendations,
        componentsRemoved: 0,
        errors: [],
        executionTime: 0
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        success: false,
        componentsAdded: 0,
        componentsUpdated: 0,
        componentsRemoved: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        executionTime: 0
      };
    }
  }

  // Run new product detection
  private async runNewProductDetection(): Promise<UpdateResult> {
    console.log('Running new product detection...');
    
    try {
      const newComponents = await componentScrapingService.detectNewComponents();
      
      console.log(`Detected ${newComponents.length} potential new components:`, newComponents);
      
      return {
        timestamp: new Date(),
        success: true,
        componentsAdded: newComponents.length,
        componentsUpdated: 0,
        componentsRemoved: 0,
        errors: [],
        executionTime: 0
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        success: false,
        componentsAdded: 0,
        componentsUpdated: 0,
        componentsRemoved: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        executionTime: 0
      };
    }
  }

  // Get update schedules
  getSchedules(): UpdateSchedule[] {
    return [...this.schedules];
  }

  // Get update history
  getUpdateHistory(limit: number = 50): UpdateResult[] {
    return this.updateHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Manual trigger of specific update
  async triggerUpdate(scheduleId: string): Promise<UpdateResult> {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    await this.runScheduledUpdate(schedule);
    return this.updateHistory[this.updateHistory.length - 1];
  }

  // Toggle schedule active state
  toggleSchedule(scheduleId: string, isActive: boolean) {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.isActive = isActive;
      console.log(`Schedule ${scheduleId} ${isActive ? 'activated' : 'deactivated'}`);
    }
  }
}

export const scheduledUpdateService = new ScheduledUpdateService();
