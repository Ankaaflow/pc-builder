// Compatibility Indicator Component
// Shows compatibility status and warnings for PC builds

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  Info,
  Cpu,
  MemoryStick,
  HardDrive,
  Settings
} from 'lucide-react';
import { CompatibilityResult, CompatibilityRule } from '../services/componentCompatibilityService';

interface CompatibilityIndicatorProps {
  compatibility: CompatibilityResult;
  showDetails?: boolean;
  compact?: boolean;
}

const CompatibilityIndicator: React.FC<CompatibilityIndicatorProps> = ({
  compatibility,
  showDetails = true,
  compact = false
}) => {
  const getStatusIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'socket':
      case 'chipset':
        return <Cpu className="h-4 w-4" />;
      case 'memory':
        return <MemoryStick className="h-4 w-4" />;
      case 'power':
        return <Zap className="h-4 w-4" />;
      case 'physical':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
    }
  };

  const overallStatus = compatibility.compatible ? 'compatible' : 
    compatibility.issues.length > 0 ? 'incompatible' : 'warning';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {overallStatus === 'compatible' && (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Compatible
          </Badge>
        )}
        {overallStatus === 'incompatible' && (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {compatibility.issues.length} Issues
          </Badge>
        )}
        {overallStatus === 'warning' && (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {compatibility.warnings.length} Warnings
          </Badge>
        )}
        
        <span className="text-sm text-gray-600">
          {compatibility.powerDraw}W / {compatibility.estimatedWattage}W PSU
        </span>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {overallStatus === 'compatible' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {overallStatus === 'incompatible' && <XCircle className="h-5 w-5 text-red-500" />}
          {overallStatus === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
          
          Build Compatibility
          
          <Badge 
            className={
              overallStatus === 'compatible' ? 'bg-green-100 text-green-800' :
              overallStatus === 'incompatible' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }
          >
            {overallStatus === 'compatible' ? 'Compatible' :
             overallStatus === 'incompatible' ? 'Issues Found' :
             'Warnings'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Power Summary */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Power Requirements</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{compatibility.powerDraw}W Total Draw</div>
            <div className="text-sm text-gray-600">Recommended PSU: {compatibility.estimatedWattage}W</div>
          </div>
        </div>

        {/* Critical Issues */}
        {compatibility.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Critical Issues ({compatibility.issues.length})
            </h4>
            {compatibility.issues.map((issue, index) => (
              <Alert key={index} variant={getAlertVariant(issue.severity)}>
                <div className="flex items-start gap-2">
                  {getTypeIcon(issue.type)}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-medium">{issue.message}</div>
                      {issue.details && (
                        <div className="text-sm text-gray-600 mt-1">{issue.details}</div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Warnings */}
        {compatibility.warnings.length > 0 && showDetails && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({compatibility.warnings.length})
            </h4>
            {compatibility.warnings.map((warning, index) => (
              <Alert key={index} variant="default">
                <div className="flex items-start gap-2">
                  {getTypeIcon(warning.type)}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-medium">{warning.message}</div>
                      {warning.details && (
                        <div className="text-sm text-gray-600 mt-1">{warning.details}</div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Success State */}
        {compatibility.compatible && compatibility.issues.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <div className="font-medium text-green-700">
                All components are compatible!
              </div>
              <div className="text-sm text-gray-600 mt-1">
                This build should work together without any issues.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Compatibility Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="font-medium text-gray-700">Socket Compatibility</div>
            <div className="text-gray-600">
              {compatibility.issues.find(i => i.type === 'socket') ? 
                '❌ Socket mismatch' : 
                '✅ Sockets match'
              }
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium text-gray-700">Memory Compatibility</div>
            <div className="text-gray-600">
              {compatibility.issues.find(i => i.type === 'memory') ? 
                '❌ Memory incompatible' : 
                '✅ Memory compatible'
              }
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium text-gray-700">Power Supply</div>
            <div className="text-gray-600">
              {compatibility.issues.find(i => i.type === 'power') ? 
                '❌ Insufficient power' : 
                '✅ Adequate power'
              }
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium text-gray-700">Physical Fit</div>
            <div className="text-gray-600">
              {compatibility.warnings.find(w => w.type === 'physical') ? 
                '⚠️ Check clearance' : 
                '✅ Should fit'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompatibilityIndicator;