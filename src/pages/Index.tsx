import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Cpu, HardDrive, MonitorSpeaker, MemoryStick, CircuitBoard, Zap, Box, Fan, Filter } from 'lucide-react';

// Enhanced components data with brands and more options
const sampleComponents = {
  cpu: [
    { id: 'cpu1', name: 'AMD Ryzen 5 7600X', brand: 'AMD', price: 229, specs: '6-Core, 4.7GHz Boost, 32MB Cache' },
    { id: 'cpu2', name: 'Intel Core i5-13600K', brand: 'Intel', price: 319, specs: '14-Core, 5.1GHz Boost, 24MB Cache' },
    { id: 'cpu3', name: 'AMD Ryzen 7 7700X', brand: 'AMD', price: 349, specs: '8-Core, 5.4GHz Boost, 32MB Cache' },
    { id: 'cpu4', name: 'Intel Core i7-13700K', brand: 'Intel', price: 409, specs: '16-Core, 5.4GHz Boost, 30MB Cache' },
    { id: 'cpu5', name: 'AMD Ryzen 9 7900X', brand: 'AMD', price: 549, specs: '12-Core, 5.6GHz Boost, 64MB Cache' },
    { id: 'cpu6', name: 'Intel Core i9-13900K', brand: 'Intel', price: 589, specs: '24-Core, 5.8GHz Boost, 36MB Cache' },
    { id: 'cpu7', name: 'AMD Ryzen 5 7600', brand: 'AMD', price: 199, specs: '6-Core, 5.1GHz Boost, 32MB Cache' },
    { id: 'cpu8', name: 'Intel Core i5-13400F', brand: 'Intel', price: 159, specs: '10-Core, 4.6GHz Boost, 20MB Cache' }
  ],
  gpu: [
    { id: 'gpu1', name: 'NVIDIA RTX 4060', brand: 'NVIDIA', price: 299, specs: '8GB GDDR6, 1080p Gaming, DLSS 3' },
    { id: 'gpu2', name: 'AMD RX 7600 XT', brand: 'AMD', price: 329, specs: '16GB GDDR6, 1440p Gaming, FSR 3' },
    { id: 'gpu3', name: 'NVIDIA RTX 4070 Super', brand: 'NVIDIA', price: 599, specs: '12GB GDDR6X, 1440p Gaming, DLSS 3' },
    { id: 'gpu4', name: 'NVIDIA RTX 4080 Super', brand: 'NVIDIA', price: 999, specs: '16GB GDDR6X, 4K Gaming, DLSS 3' },
    { id: 'gpu5', name: 'AMD RX 7800 XT', brand: 'AMD', price: 479, specs: '16GB GDDR6, 1440p Gaming, FSR 3' },
    { id: 'gpu6', name: 'NVIDIA RTX 4090', brand: 'NVIDIA', price: 1599, specs: '24GB GDDR6X, 4K Gaming, DLSS 3' },
    { id: 'gpu7', name: 'AMD RX 7600', brand: 'AMD', price: 269, specs: '8GB GDDR6, 1080p Gaming, FSR 3' },
    { id: 'gpu8', name: 'NVIDIA RTX 4060 Ti', brand: 'NVIDIA', price: 399, specs: '16GB GDDR6, 1440p Gaming, DLSS 3' }
  ],
  motherboard: [
    { id: 'mb1', name: 'ASUS B650-A WiFi', price: 179, specs: 'ATX, AM5 Socket, WiFi 6' },
    { id: 'mb2', name: 'MSI Z790 Gaming Plus', price: 199, specs: 'ATX, LGA1700, DDR5' },
    { id: 'mb3', name: 'ASUS X670E Hero', price: 599, specs: 'ATX, AM5, Premium Features' },
    { id: 'mb4', name: 'Gigabyte Z790 Master', price: 479, specs: 'E-ATX, LGA1700, 10Gb LAN' }
  ],
  ram: [
    { id: 'ram1', name: 'Corsair Vengeance 16GB', price: 79, specs: 'DDR5-5600, 2x8GB' },
    { id: 'ram2', name: 'G.Skill Trident Z5 32GB', price: 159, specs: 'DDR5-6000, 2x16GB' },
    { id: 'ram3', name: 'Kingston Fury Beast 32GB', price: 139, specs: 'DDR5-5200, 2x16GB' },
    { id: 'ram4', name: 'Corsair Dominator 64GB', price: 599, specs: 'DDR5-5600, 2x32GB' }
  ],
  storage: [
    { id: 'ssd1', name: 'Samsung 980 Pro 1TB', price: 99, specs: 'NVMe Gen4, 7000MB/s' },
    { id: 'ssd2', name: 'WD Black SN850X 2TB', price: 199, specs: 'NVMe Gen4, 7300MB/s' },
    { id: 'ssd3', name: 'Crucial P5 Plus 1TB', price: 79, specs: 'NVMe Gen4, 6600MB/s' },
    { id: 'ssd4', name: 'Samsung 990 Pro 4TB', price: 449, specs: 'NVMe Gen4, 7450MB/s' }
  ],
  psu: [
    { id: 'psu1', name: 'Corsair RM750x', price: 139, specs: '750W, 80+ Gold, Modular' },
    { id: 'psu2', name: 'EVGA SuperNOVA 850W', price: 159, specs: '850W, 80+ Gold, Modular' },
    { id: 'psu3', name: 'Seasonic Focus GX-1000', price: 199, specs: '1000W, 80+ Gold, Modular' },
    { id: 'psu4', name: 'Corsair AX1600i', price: 549, specs: '1600W, 80+ Titanium, Digital' }
  ],
  case: [
    { id: 'case1', name: 'Fractal Design Define 7', price: 179, specs: 'Mid-Tower, Silent, Tempered Glass' },
    { id: 'case2', name: 'NZXT H7 Flow', price: 139, specs: 'Mid-Tower, High Airflow, RGB' },
    { id: 'case3', name: 'Lian Li O11 Dynamic', price: 159, specs: 'Mid-Tower, Dual Chamber, Glass' },
    { id: 'case4', name: 'Phanteks Enthoo Pro 2', price: 199, specs: 'Full-Tower, Premium Build Quality' }
  ],
  cooling: [
    { id: 'cool1', name: 'Noctua NH-D15', price: 109, specs: 'Dual Tower, 140mm Fans, Silent' },
    { id: 'cool2', name: 'Corsair H100i Elite', price: 139, specs: '240mm AIO, RGB Pump, Quiet' },
    { id: 'cool3', name: 'Arctic Liquid Freezer II 280', price: 119, specs: '280mm AIO, High Performance' },
    { id: 'cool4', name: 'NZXT Kraken Z73', price: 279, specs: '360mm AIO, LCD Display, RGB' }
  ]
};

const budgetPresets = [
  { name: 'Budget Gaming', min: 500, max: 800 },
  { name: 'Mid-Range', min: 800, max: 1500 },
  { name: 'High-End', min: 1500, max: 3000 },
  { name: 'Enthusiast', min: 3000, max: 10000 }
];

const Index = () => {
  const [selectedBudget, setSelectedBudget] = useState<{ min: number; max: number } | null>(null);
  const [customBudget, setCustomBudget] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, any>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleBudgetSelect = (budget: { min: number; max: number }) => {
    setSelectedBudget(budget);
    setCustomBudget('');
  };

  const handleCustomBudget = (value: string) => {
    setCustomBudget(value);
    if (value) {
      const amount = parseInt(value);
      if (!isNaN(amount)) {
        setSelectedBudget({ min: amount, max: amount });
      }
    } else {
      setSelectedBudget(null);
    }
  };

  const handleComponentSelect = (category: string, component: any) => {
    setSelectedComponents(prev => ({
      ...prev,
      [category]: component
    }));
  };

  const getTotalPrice = () => {
    return Object.values(selectedComponents).reduce((total: number, component: any) => {
      return total + (component?.price || 0);
    }, 0);
  };

  const getBudgetStatus = () => {
    if (!selectedBudget) return null;
    const total = getTotalPrice();
    const maxBudget = selectedBudget.max;
    
    if (total > maxBudget) return 'over';
    if (total > maxBudget * 0.9) return 'warning';
    return 'good';
  };

  const categoryIcons = {
    cpu: Cpu,
    gpu: MonitorSpeaker,
    motherboard: CircuitBoard,
    ram: MemoryStick,
    storage: HardDrive,
    psu: Zap,
    case: Box,
    cooling: Fan
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Build me a gaming PC
              </h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-700 hover:text-blue-500 font-medium transition-colors">Home</a>
                <a href="#" className="text-gray-700 hover:text-blue-500 font-medium transition-colors">Build PC</a>
                <a href="#" className="text-gray-700 hover:text-blue-500 font-medium transition-colors">Browse Builds</a>
                <a href="#" className="text-gray-700 hover:text-blue-500 font-medium transition-colors">Guides</a>
                <a href="#" className="text-gray-700 hover:text-blue-500 font-medium transition-colors">News</a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Build Your Dream Gaming PC
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Configure the perfect gaming setup with our intelligent component selector. 
            Get real-time compatibility checks, budget tracking, and expert recommendations.
          </p>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg">
            Start Building
          </Button>
        </div>
      </section>

      {/* Budget Selection */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Budget</h3>
          <div className="flex flex-wrap gap-4 items-end">
            {budgetPresets.map((preset, index) => (
              <Button
                key={index}
                variant={selectedBudget?.min === preset.min && selectedBudget?.max === preset.max ? "default" : "outline"}
                onClick={() => handleBudgetSelect(preset)}
                className="hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all"
              >
                {preset.name}
                <br />
                <span className="text-sm opacity-75">
                  ${preset.min}-{preset.max === 10000 ? preset.min + '+' : preset.max}
                </span>
              </Button>
            ))}
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Custom budget"
                value={customBudget}
                onChange={(e) => handleCustomBudget(e.target.value)}
                className="w-40"
              />
              {customBudget && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  ${customBudget}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Component Categories */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(sampleComponents).map(([category, components]) => {
                const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
                return (
                  <Card key={category} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 capitalize">
                        <IconComponent className="h-5 w-5 text-blue-500" />
                        <span>{category === 'gpu' ? 'Graphics Card' : category === 'psu' ? 'Power Supply' : category}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {components.map((component) => (
                          <div
                            key={component.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-blue-50 ${
                              selectedComponents[category]?.id === component.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                            onClick={() => handleComponentSelect(category, component)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{component.name}</h4>
                                <p className="text-sm text-gray-600">{component.specs}</p>
                              </div>
                              <span className="font-bold text-green-600">${component.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Build Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Build Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(selectedComponents).length === 0 ? (
                    <p className="text-gray-500 text-sm">Select components to see your build summary</p>
                  ) : (
                    <>
                      {Object.entries(selectedComponents).map(([category, component]) => (
                        <div key={category} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm capitalize">
                              {category === 'gpu' ? 'GPU' : category === 'psu' ? 'PSU' : category}
                            </p>
                            <p className="text-xs text-gray-600 truncate">{component.name}</p>
                          </div>
                          <span className="text-sm font-bold">${component.price}</span>
                        </div>
                      ))}
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">Total</span>
                          <span className="text-xl font-bold text-green-600">${getTotalPrice()}</span>
                        </div>
                        
                        {selectedBudget && (
                          <div className="mt-2">
                            <div className={`text-sm ${
                              getBudgetStatus() === 'over' ? 'text-red-600' : 
                              getBudgetStatus() === 'warning' ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {getBudgetStatus() === 'over' && `Over budget by $${getTotalPrice() - selectedBudget.max}`}
                              {getBudgetStatus() === 'warning' && `Approaching budget limit`}
                              {getBudgetStatus() === 'good' && `Within budget`}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  getBudgetStatus() === 'over' ? 'bg-red-500' :
                                  getBudgetStatus() === 'warning' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min((getTotalPrice() / selectedBudget.max) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        Save Build
                      </Button>
                    </>
                  )}
                  
                  {/* Ad Space Placeholder */}
                  <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Advertisement</p>
                    <div className="h-20 bg-gray-200 rounded mt-2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Build me a gaming PC</h3>
              <p className="text-gray-400">The ultimate PC building configurator for gamers and enthusiasts.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Build Tools</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">PC Builder</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compatibility Check</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Price Tracker</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Build Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Component Reviews</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Benchmarks</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Build me a gaming PC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
