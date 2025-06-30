// Database Administration Interface
// Monitor and manage the component database and automated processes

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  RefreshCw, 
  TrendingUp, 
  Link, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  BarChart3,
  Settings,
  Play,
  Stop
} from 'lucide-react';
import { componentDatabaseService } from '../services/componentDatabaseService';
import { automatedMaintenanceService } from '../services/automatedMaintenanceService';
import { redditComponentExtractor } from '../services/redditComponentExtractor';

interface SystemStats {
  total_components: number;
  valid_links: number;
  invalid_links: number;
  recent_mentions: number;
}

interface PopularComponent {
  id: string;
  name: string;
  brand: string;
  category: string;
  popularity_score: number;
}

interface RecentLog {
  id: string;
  process_name: string;
  status: string;
  message: string;
  created_at: string;
  details?: any;
}

const DatabaseAdmin: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    total_components: 0,
    valid_links: 0,
    invalid_links: 0,
    recent_mentions: 0
  });
  
  const [popularComponents, setPopularComponents] = useState<PopularComponent[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, popularData, logsData] = await Promise.all([
        componentDatabaseService.getComponentStats(),
        componentDatabaseService.getPopularComponents(undefined, 10),
        loadRecentLogs()
      ]);

      setStats(statsData);
      setPopularComponents(popularData);
      setRecentLogs(logsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentLogs = async (): Promise<RecentLog[]> => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to load system logs:', error);
      return [];
    }
  };

  const handleStartMaintenance = async () => {
    setMaintenanceRunning(true);
    try {
      automatedMaintenanceService.start();
      await componentDatabaseService.logProcess(
        'maintenance_start',
        'completed',
        'Automated maintenance started from admin interface'
      );
    } catch (error) {
      console.error('Failed to start maintenance:', error);
    }
  };

  const handleStopMaintenance = async () => {
    try {
      automatedMaintenanceService.stop();
      await componentDatabaseService.logProcess(
        'maintenance_stop',
        'completed',
        'Automated maintenance stopped from admin interface'
      );
    } catch (error) {
      console.error('Failed to stop maintenance:', error);
    } finally {
      setMaintenanceRunning(false);
    }
  };

  const handleManualMaintenance = async () => {
    setIsLoading(true);
    try {
      await automatedMaintenanceService.runManualMaintenance();
      await loadDashboardData();
    } catch (error) {
      console.error('Manual maintenance failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedditExtraction = async () => {
    setIsLoading(true);
    try {
      await redditComponentExtractor.runExtractionProcess();
      await loadDashboardData();
    } catch (error) {
      console.error('Reddit extraction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'started': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const linkHealthPercentage = stats.valid_links + stats.invalid_links > 0 
    ? (stats.valid_links / (stats.valid_links + stats.invalid_links) * 100)
    : 0;

  if (isLoading && stats.total_components === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading database administration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Administration
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor component database, Amazon links, and automated processes
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Components</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_components}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Link Health</p>
                  <p className="text-2xl font-bold text-gray-900">{linkHealthPercentage.toFixed(1)}%</p>
                </div>
                <CheckCircle className={`h-8 w-8 ${linkHealthPercentage > 80 ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valid Links</p>
                  <p className="text-2xl font-bold text-green-600">{stats.valid_links}</p>
                </div>
                <Link className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Mentions</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.recent_mentions}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleStartMaintenance}
                disabled={maintenanceRunning}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Automated Maintenance
              </Button>

              <Button 
                variant="outline"
                onClick={handleStopMaintenance}
                disabled={!maintenanceRunning}
                className="flex items-center gap-2"
              >
                <Stop className="h-4 w-4" />
                Stop Automated Maintenance
              </Button>

              <Button 
                variant="outline"
                onClick={handleManualMaintenance}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Run Manual Maintenance
              </Button>

              <Button 
                variant="outline"
                onClick={handleRedditExtraction}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Extract Reddit Components
              </Button>

              <Button 
                variant="outline"
                onClick={loadDashboardData}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="popular" className="space-y-6">
          <TabsList>
            <TabsTrigger value="popular">Popular Components</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Most Popular Components
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularComponents.map((component, index) => (
                    <div key={component.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{component.name}</h4>
                          <p className="text-sm text-gray-600">{component.brand} • {component.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          Score: {component.popularity_score.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent System Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">{log.process_name}</h4>
                        <p className="text-sm text-gray-600">{log.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Link Health Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Valid Links</span>
                      <span className="text-green-600 font-semibold">{stats.valid_links}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${linkHealthPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Invalid Links</span>
                      <span className="text-red-600 font-semibold">{stats.invalid_links}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Components</span>
                      <span className="font-semibold">{stats.total_components}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Recent Reddit Mentions</span>
                      <span className="font-semibold">{stats.recent_mentions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">System Status</span>
                      <Badge className={maintenanceRunning ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {maintenanceRunning ? 'Running' : 'Stopped'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DatabaseAdmin;