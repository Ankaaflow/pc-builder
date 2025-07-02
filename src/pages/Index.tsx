
import React, { useState } from 'react';
import BudgetSelector from '../components/BudgetSelector';
import ComponentSelector from '../components/ComponentSelector';
import { Region } from '../utils/budgetAllocator';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'budget' | 'components'>('budget');
  const [budget, setBudget] = useState<number>(0);
  const [region, setRegion] = useState<Region>('US');

  const handleBudgetSet = (selectedBudget: number, selectedRegion: Region) => {
    setBudget(selectedBudget);
    setRegion(selectedRegion);
    setCurrentStep('components');
  };

  const handleBackToBudget = () => {
    setCurrentStep('budget');
  };

  return (
    <div className="min-h-screen relative">{currentStep === 'budget' ? (
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
