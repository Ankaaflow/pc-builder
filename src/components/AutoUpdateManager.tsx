
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Database,
  MessageSquare,
  Search
} from 'lucide-react';
import { scheduledUpdateService, UpdateSchedule, UpdateResult } from '../services/ScheduledUpdateService';
import { componentScrapingService } from '../services/ComponentScrapingService';

const AutoUpdateManager: React.FC = () => {
  const [schedules, setSchedules] = useState<UpdateSchedule[]>([]);
  const [updateHistory, setUpdateHistory] = useState<UpdateResult[]>([]);
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
    // Start the service automatically
    scheduledUpdateService.start();
    setIsServiceRunning(true);
  }, []);

  const loadData = () => {
    setSchedules(scheduledUpdateService.getSchedules());
    setUpdateHistory(scheduledUpdateService.getUpdateHistory(20));
  };

  const handleToggleService = () => {
    if (isServiceRunning) {
      scheduledUpdateService.stop();
    } else {
      scheduledUpdateService.start();
    }
    setIsServiceRunning(!isServiceRunning);
  };

  const handleToggleSchedule = (scheduleId: string, isActive: boolean) => {
    scheduledUpdateService.toggleSchedule(scheduleId, isActive);
    loadData();
  };

  const handleManualTrigger = async (scheduleId: string) => {
    setIsLoading(true);
    try {
      const result = await scheduledUpdateService.triggerUpdate(scheduleId);
      console.log('Manual update result:', result);
      loadData();
    } catch (error) {
      console.error('Manual update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleIcon = (scheduleId: string) => {
    switch (scheduleId) {
      case 'price-updates':
        return <TrendingUp className="h-4 w-4" />;
      case 'component-discovery':
        return <Database className="h-4 w-4" />;
      case 'reddit-recommendations':
        return <MessageSquare className="h-4 w-4" />;
      case 'new-product-detection':
        return <Search className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const formatNextRun = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Service Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Automated Update Service
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant={isServiceRunning ? "default" : "secondary"}>
                {isServiceRunning ? 'Running' : 'Stopped'}
              </Badge>
              <Button
                onClick={handleToggleService}
                variant={isServiceRunning ? "destructive" : "default"}
                size="sm"
              >
                {isServiceRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Service
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Service
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Automated component discovery service monitors multiple sources for new components, 
            price changes, and community recommendations. Cost: ~$15-25/month.
          </p>
        </CardContent>
      </Card>

      {/* Update Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Update Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getScheduleIcon(schedule.id)}
                  <div>
                    <h4 className="font-medium">{schedule.name}</h4>
                    <p className="text-sm text-gray-600">
                      {schedule.frequency} • Next run: {formatNextRun(schedule.nextRun)}
                    </p>
                    {schedule.lastRun && (
                      <p className="text-xs text-gray-500">
                        Last run: {schedule.lastRun.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={schedule.isActive ? "default" : "secondary"}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    onClick={() => handleToggleSchedule(schedule.id, !schedule.isActive)}
                    variant="outline"
                    size="sm"
                  >
                    {schedule.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    onClick={() => handleManualTrigger(schedule.id)}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Update History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {updateHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No updates yet</p>
          ) : (
            <div className="space-y-3">
              {updateHistory.map((update, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {update.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {update.timestamp.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        Added: {update.componentsAdded} • Updated: {update.componentsUpdated} • 
                        Removed: {update.componentsRemoved}
                      </p>
                      {update.errors.length > 0 && (
                        <p className="text-xs text-red-600">
                          {update.errors.length} error(s)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={update.success ? "default" : "destructive"}>
                      {update.success ? 'Success' : 'Failed'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {update.executionTime}ms
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Price Updates</p>
                <p className="text-2xl font-bold">
                  {updateHistory.reduce((sum, update) => sum + update.componentsUpdated, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Components Added</p>
                <p className="text-2xl font-bold">
                  {updateHistory.reduce((sum, update) => sum + update.componentsAdded, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Reddit Sources</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-gray-500">buildapc, buildmeapc, buildapcforme</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">
                  {updateHistory.length > 0 
                    ? Math.round((updateHistory.filter(u => u.success).length / updateHistory.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutoUpdateManager;
