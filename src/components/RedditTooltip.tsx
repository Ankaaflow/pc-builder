import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ThumbsUp, ThumbsDown, TrendingUp, Users } from 'lucide-react';
import { redditService } from '../services/redditService';

interface RedditTooltipProps {
  componentName: string;
  children: React.ReactNode;
  className?: string;
}

interface TooltipData {
  insights: string[];
  pros: string[];
  cons: string[];
  redditScore: number;
  loading: boolean;
  error: boolean;
}

const RedditTooltip: React.FC<RedditTooltipProps> = ({ 
  componentName, 
  children, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData>({
    insights: [],
    pros: [],
    cons: [],
    redditScore: 0,
    loading: false,
    error: false
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });

  const fetchTooltipData = async () => {
    if (tooltipData.insights.length > 0 || tooltipData.loading) return;

    setTooltipData(prev => ({ ...prev, loading: true, error: false }));

    try {
      const data = await redditService.getComponentTooltip(componentName);
      
      if (data) {
        setTooltipData({
          insights: data.insights,
          pros: data.pros,
          cons: data.cons,
          redditScore: data.redditScore,
          loading: false,
          error: false
        });
      } else {
        setTooltipData(prev => ({ 
          ...prev, 
          loading: false, 
          error: true 
        }));
      }
    } catch (error) {
      console.error('Failed to fetch tooltip data:', error);
      setTooltipData(prev => ({ 
        ...prev, 
        loading: false, 
        error: true 
      }));
    }
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setIsVisible(true);
    fetchTooltipData();
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const hasContent = tooltipData.insights.length > 0 || 
                    tooltipData.pros.length > 0 || 
                    tooltipData.cons.length > 0;

  return (
    <>
      <div
        className={`relative cursor-help ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        
        {/* Small indicator that tooltip is available */}
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Tooltip Portal */}
      {isVisible && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <Card className="w-80 max-w-sm shadow-lg border border-gray-300 bg-white">
            <CardContent className="p-4">
              {tooltipData.loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">
                    Loading Reddit insights...
                  </span>
                </div>
              )}

              {tooltipData.error && !tooltipData.loading && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    Unable to load Reddit insights
                  </p>
                </div>
              )}

              {hasContent && !tooltipData.loading && (
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-900">
                      Reddit Community Insights
                    </h4>
                    {tooltipData.redditScore > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {tooltipData.redditScore} upvotes
                      </Badge>
                    )}
                  </div>

                  {/* Key Insights */}
                  {tooltipData.insights.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-3 h-3 text-blue-500 mr-1" />
                        <span className="font-medium text-xs text-gray-700">
                          Key Insights
                        </span>
                      </div>
                      <div className="space-y-1">
                        {tooltipData.insights.slice(0, 2).map((insight, index) => (
                          <p key={index} className="text-xs text-gray-600 leading-relaxed">
                            • {insight}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pros and Cons */}
                  <div className="grid grid-cols-1 gap-2">
                    {tooltipData.pros.length > 0 && (
                      <div>
                        <div className="flex items-center mb-1">
                          <ThumbsUp className="w-3 h-3 text-green-500 mr-1" />
                          <span className="font-medium text-xs text-green-700">
                            Pros
                          </span>
                        </div>
                        <div className="space-y-1">
                          {tooltipData.pros.slice(0, 2).map((pro, index) => (
                            <p key={index} className="text-xs text-green-600">
                              • {pro}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {tooltipData.cons.length > 0 && (
                      <div>
                        <div className="flex items-center mb-1">
                          <ThumbsDown className="w-3 h-3 text-red-500 mr-1" />
                          <span className="font-medium text-xs text-red-700">
                            Cons
                          </span>
                        </div>
                        <div className="space-y-1">
                          {tooltipData.cons.slice(0, 2).map((con, index) => (
                            <p key={index} className="text-xs text-red-600">
                              • {con}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Source indicator */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">
                      Based on r/buildapc & r/buildmeapc discussions
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-300"></div>
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white absolute top-[-1px] left-[-4px]"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default RedditTooltip;