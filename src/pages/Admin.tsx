
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Database, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AutoUpdateManager from '../components/AutoUpdateManager';

const Admin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage automated component discovery and updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">System Administration</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-blue-600" />
                Component Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-sm text-gray-600">Total Components</p>
                <div className="text-xs text-gray-500">
                  <span className="text-green-600">+23 today</span> • 
                  <span className="text-blue-600"> 156 updated</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-gray-600">Active Sources</p>
                <div className="text-xs text-gray-500">
                  PCPartPicker • Newegg • Amazon • Reddit • TechPowerUp • AnandTech
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-purple-600" />
                Automation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-sm text-gray-600">All Systems Running</p>
                <div className="text-xs text-gray-500">
                  Last update: 15 minutes ago
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto Update Manager */}
        <AutoUpdateManager />
      </div>
    </div>
  );
};

export default Admin;
