
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BudgetSelector from '../components/BudgetSelector';
import ComponentSelector from '../components/ComponentSelector';
import { Region } from '../utils/budgetAllocator';
import { autonomousSystemInitializer } from '../services/autonomousSystemInitializer';
import '../utils/amazonLinkTester'; // Load Amazon link testing utilities
import '../utils/regionDetection'; // Load region detection utilities
import '../utils/asinValidator'; // Load ASIN validation utilities
import '../utils/amazonLinkValidator'; // Load Amazon link validation utilities
import '../utils/amazonLinkDebugger'; // Load Amazon link debugging utilities
import '../services/asinUpdateService'; // Load automated ASIN update service

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'budget' | 'components'>('budget');
  const [budget, setBudget] = useState<number>(0);
  const [region, setRegion] = useState<Region>('US');
  const navigate = useNavigate();

  const handleBudgetSet = (selectedBudget: number, selectedRegion: Region) => {
    setBudget(selectedBudget);
    setRegion(selectedRegion);
    setCurrentStep('components');
  };

  const handleBackToBudget = () => {
    setCurrentStep('budget');
  };

  // Initialize autonomous systems when the app starts
  useEffect(() => {
    autonomousSystemInitializer.initialize();
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Admin Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <Settings className="h-4 w-4" />
          Admin
        </Button>
      </div>

      {currentStep === 'budget' ? (
        <BudgetSelector onBudgetSet={handleBudgetSet} />
      ) : (
        <ComponentSelector
          budget={budget}
          region={region}
          onBack={handleBackToBudget}
        />
      )}
    </div>
  );
};

export default Index;
