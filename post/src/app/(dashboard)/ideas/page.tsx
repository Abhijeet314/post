'use client';
import React, { useState, useEffect } from 'react';
import { MarketingPlan } from '@/lib/aiservice';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function MarketingPlannerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    tone: 'professional',
    platforms: ['twitter'],
    productDescription: '',
    industry: ['technology'],
    targetAudience: ['professionals'],
    usp: '',
    currentStage: 'idea'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [marketingPlan, setMarketingPlan] = useState<MarketingPlan | null>(null);
  const [error, setError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [_exportLoading, setExportLoading] = useState(false);
  
  // State to track expanded weeks and days
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  
  // Add these state variables at the top of the component with the other useState calls
  
  const _toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name } = e.target;
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      [name]: values
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMarketingPlan(null);
    setExpandedWeek(null);
    setExpandedDay(null);

    try {
      const response = await fetch('/api/generate-marketing-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate marketing plan');
      }

      const data = await response.json();
      setMarketingPlan(data.marketingPlan);
      
      // Store the marketing plan in localStorage for persistence across routes
      localStorage.setItem('marketingPlan', JSON.stringify(data.marketingPlan));

      // Close the sidebar after successful generation
      setSidebarOpen(false);
      console.log(_toggleSidebar);
      console.log(_toggleWeek);
      console.log(_toggleDay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Load marketing plan from localStorage on component mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('marketingPlan');
    if (savedPlan) {
      try {
        setMarketingPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('Error parsing saved marketing plan:', e);
      }
    }
  }, []);

  // Add effect to clear the success message after a delay
  useEffect(() => {
    if (exportSuccess) {
      const timer = setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  // Add this useEffect after the other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportOptions && !target.closest('.export-dropdown')) {
        setShowExportOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportOptions]);

  const getActivityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'post':
        return 'bg-blue-100 text-blue-800';
      case 'analysis':
        return 'bg-purple-100 text-purple-800';
      case 'research':
        return 'bg-green-100 text-green-800';
      case 'engagement':
        return 'bg-amber-100 text-amber-800';
      case 'content':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  // Using underscore prefix as these functions are defined but not used
  // They may be used in the future or are needed for code completion
  const _toggleWeek = (weekNumber: number) => {
    setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
    setExpandedDay(null); // Close any open day when toggling weeks
  };

  const _toggleDay = (dayName: string) => {
    setExpandedDay(expandedDay === dayName ? null : dayName);
  };

  // Add function to handle exporting the marketing plan
  const handleExportPlan = () => {
    if (!marketingPlan) return;
    
    // Create a formatted plan for export is unused, but kept for reference
    // const _formattedPlan = { ... }
    
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      // Show dropdown for export format
      setShowExportOptions(true);
    }
  };
  
  // Add this new function below handleExportPlan
  const handleExportWithFormat = async (format: string) => {
    if (!marketingPlan) return;
    
    // Create a formatted plan for export
    const formattedPlan = {
      title: marketingPlan.title,
      overview: marketingPlan.overview,
      settings: {
        tone: formData.tone,
        platforms: formData.platforms,
        industry: formData.industry,
        targetAudience: formData.targetAudience,
        stage: formData.currentStage
      },
      weeks: marketingPlan.weeks.map(week => ({
        weekNumber: week.weekNumber,
        goals: week.goals,
        days: week.days.map(day => ({
          dayName: day.dayName,
          activities: day.activities.map(activity => ({
            title: activity.title,
            description: activity.description,
            type: activity.type,
            platform: activity.platform
          }))
        }))
      }))
    };
    
    if (format === 'pdf') {
      // For PDF export, we'll use jspdf
      // Need to import these at the top of the file
      // import jsPDF from 'jspdf';
      // import autoTable from 'jspdf-autotable';
      
      try {
        const { exportToPDF } = await import('@/lib/exportUtils');
        
        // Convert marketing plan to a format that works with our PDF export
        const pdfExportData = marketingPlan.weeks.flatMap(week => 
          week.days.flatMap(day => 
            day.activities.map(activity => ({
              id: `${week.weekNumber}-${day.dayName}-${activity.title}`,
              content: activity.description,
              platform: activity.platform || 'All platforms',
              type: activity.type,
              week: week.weekNumber,
              day: day.dayName
            }))
          )
        );
        
        exportToPDF(pdfExportData, `Marketing Plan - ${new Date().toLocaleDateString()}`);
      } catch (err) {
        console.error('Error exporting PDF:', err);
      }
    } else if (format === 'json') {
      // JSON Export (existing functionality)
      // Convert the formatted plan to a JSON string
      const jsonString = JSON.stringify(formattedPlan, null, 2);
      
      // Create a Blob containing the data
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `marketing_plan_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'text') {
      // Plain text export
      try {
        // Generate text content
        let textContent = `MARKETING PLAN\n`;
        textContent += `${marketingPlan.title}\n\n`;
        textContent += `OVERVIEW\n${marketingPlan.overview}\n\n`;
        
        // Add settings
        textContent += `SETTINGS\n`;
        textContent += `Tone: ${formData.tone}\n`;
        textContent += `Platforms: ${formData.platforms.join(', ')}\n`;
        textContent += `Industry: ${formData.industry.join(', ')}\n`;
        textContent += `Target Audience: ${formData.targetAudience.join(', ')}\n`;
        textContent += `Stage: ${formData.currentStage}\n\n`;
        
        // Add weeks and activities
        marketingPlan.weeks.forEach(week => {
          textContent += `WEEK ${week.weekNumber}: ${week.theme}\n`;
          textContent += `Goals:\n`;
          week.goals.forEach(goal => textContent += `- ${goal}\n`);
          textContent += `\n`;
          
          week.days.forEach(day => {
            textContent += `${day.dayName}:\n`;
            day.activities.forEach(activity => {
              textContent += `• ${activity.title} (${activity.platform || 'All platforms'})\n`;
              textContent += `  ${activity.description}\n\n`;
            });
          });
          
          textContent += `\n`;
        });
        
        // Create blob and download
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `marketing_plan_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error exporting text:', err);
      }
    }
    
    // Hide dropdown and show success
    setShowExportOptions(false);
    setExportSuccess(true);
    setTimeout(() => {
      setExportSuccess(false);
    }, 3000);
  };

  // Add a new function to export the full marketing plan including generated content
  const handleExportFullPlan = async (format: string) => {
    if (!marketingPlan) return;
    
    try {
      setExportLoading(true);
      console.log(_exportLoading);
      
      // Get any saved generated content from localStorage
      const savedContents = JSON.parse(localStorage.getItem('generatedContents') || '{}');
      
      // Use the API to get structured data for export
      const response = await fetch('/api/export-marketing-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marketingPlan,
          generatedContents: savedContents,
          format
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to prepare export data');
      }
      
      const data = await response.json();
      
      // Use the export utilities to generate the appropriate format
      const title = `${marketingPlan.title} - Complete Plan`;
      
      switch (format) {
        case 'pdf':
          const { exportToPDF } = await import('@/lib/exportUtils');
          exportToPDF(data.items, title);
          break;
        case 'json':
          const { exportToJSON } = await import('@/lib/exportUtils');
          exportToJSON(data.items, title);
          break;
        case 'text':
          const { exportToText } = await import('@/lib/exportUtils');
          exportToText(data.items, title);
          break;
      }
      
      // Show success message
      setExportSuccess(true);
      setShowExportOptions(false);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error exporting full plan:', error);
      setError('Failed to export the marketing plan');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Main content - the primary content */}
      <div className="flex-1 min-h-screen transition-all duration-300 ease-in-out">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header with Generate Marketing Plan button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Marketing Planner</h1>
            {marketingPlan && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Plan</span>
              </button>
            )}
          </div>

          {/* Success message for export */}
          <AnimatePresence>
            {exportSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100 mb-6"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">Marketing plan exported successfully!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-100 mb-6"
              >
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Marketing Plan Content */}
          <div className="space-y-6">
            {marketingPlan ? (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}  
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{marketingPlan.title}</h1>
                        <p className="text-gray-600">{marketingPlan.overview}</p>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <div className="relative export-dropdown">
                          <button 
                            onClick={handleExportPlan}
                            className="group inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4 mr-2 text-blue-500 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Plan
                          </button>
                          
                          {showExportOptions && (
                            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                  onClick={() => handleExportWithFormat('pdf')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  Export Plan Structure (PDF)
                                </button>
                                <button
                                  onClick={() => handleExportWithFormat('json')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export Plan Structure (JSON)
                                </button>
                                <button
                                  onClick={() => handleExportWithFormat('text')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export Plan Structure (Text)
                                </button>
                                
                                <div className="border-t border-gray-100 my-1"></div>
                                
                                <button
                                  onClick={() => handleExportFullPlan('pdf')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export Full Plan with Content (PDF)
                                </button>
                                <button
                                  onClick={() => handleExportFullPlan('json')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export Full Plan with Content (JSON)
                                </button>
                                <button
                                  onClick={() => handleExportFullPlan('text')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export Full Plan with Content (Text)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Platforms</p>
                        <p className="text-sm mt-1 font-medium text-gray-800">{formData.platforms.length} Platforms</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">Duration</p>
                        <p className="text-sm mt-1 font-medium text-gray-800">4 Weeks</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">Content Style</p>
                        <p className="text-sm mt-1 font-medium text-gray-800 capitalize">{formData.tone}</p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <p className="text-xs text-amber-600 font-medium">Stage</p>
                        <p className="text-sm mt-1 font-medium text-gray-800 capitalize">{formData.currentStage}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md p-5 mb-6 text-white">
                    <div className="flex items-start">
                      <svg className="w-8 h-8 text-white opacity-90 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div>
                        <h3 className="font-bold text-lg">New: AI-Powered Content Generation</h3>
                        <p className="text-indigo-100 mt-1">
                          Click on any days activities and use the Generate Content button to create detailed posts, 
                          analytics reports, and tasks tailored to your marketing strategy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {marketingPlan.weeks.map((week) => (
                      <Link href={`/ideas/${week.weekNumber}`} key={week.weekNumber} className="block">
                        <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 border border-gray-100">
                          <div className="p-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            <div className="flex justify-between items-center">
                              <h3 className="text-xl font-bold">Week {week.weekNumber}</h3>
                              <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
                                {week.days.reduce((acc, day) => acc + day.activities.length, 0)} activities
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                                <svg className="w-4 h-4 text-blue-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Goals for Week {week.weekNumber}
                              </h4>
                              <ul className="space-y-2 text-sm text-gray-700">
                                {week.goals.slice(0, 3).map((goal, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="inline-block w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex-shrink-0 mr-2 flex items-center justify-center text-xs font-medium">
                                      {i + 1}
                                    </span>
                                    <span>{goal}</span>
                                  </li>
                                ))}
                                {week.goals.length > 3 && (
                                  <li className="text-blue-600 text-sm pl-7">
                                    + {week.goals.length - 3} more goals
                                  </li>
                                )}
                              </ul>
                            </div>
                            
                            <div className="mt-5 border-t border-gray-100 pt-4">
                              {/* Platform indicators */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                {Array.from(new Set(week.days.flatMap(day => 
                                  day.activities.map(a => a.platform)
                                ).filter(Boolean))).map((platform, i) => (
                                  platform && (
                                    <div key={i} className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                                      <span className="text-gray-600 mr-1">{getPlatformIcon(platform as string)}</span>
                                      <span className="capitalize">{platform}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                              
                              {/* Activity previews */}
                              <div className="flex justify-between items-center">
                                <div className="flex -space-x-2">
                                  {Array.from(new Set(week.days.flatMap(day => 
                                    day.activities.map(a => a.type)
                                  ).filter(Boolean))).slice(0, 3).map((type, i) => (
                                    <div 
                                      key={i} 
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white ${getActivityTypeColor(type as string)}`}
                                    >
                                      {(type as string).charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                                <div className="text-blue-600 text-sm flex items-center font-medium">
                                  View week details 
                                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Detailed Week View Section */}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                <div className="max-w-md mx-auto">
                  <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Marketing Plan</h3>
                  <p className="text-gray-600 mb-5">
                    Click the button below to create a personalized 4-week marketing strategy for your business.
                  </p>
                  <div className="flex items-center justify-center mt-6">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-md"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Generate Marketing Plan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marketing Plan Form Modal */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] overflow-y-auto overflow-x-hidden">
          {/* Modal backdrop with blur effect */}
          <div 
            className="fixed inset-0 bg-gray-500/30 dark:bg-gray-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
          
          {/* Modal content */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md md:max-w-lg z-[1001] relative overflow-hidden mx-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create Plan</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Fill in the details to generate your 4-week marketing strategy</p>
              
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Product Description
                  </label>
                  <textarea
                    name="productDescription"
                    value={formData.productDescription}
                    onChange={handleFormChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm transition-all duration-200 bg-white dark:bg-gray-900"
                    placeholder="Describe your product or service in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Unique Selling Proposition
                  </label>
                  <input
                    type="text"
                    name="usp"
                    value={formData.usp}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm transition-all duration-200 bg-white dark:bg-gray-900"
                    placeholder="What makes your product unique?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Tone
                    </label>
                    <select
                      name="tone"
                      value={formData.tone}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white dark:bg-gray-900"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="humorous">Humorous</option>
                      <option value="sarcastic">Sarcastic</option>
                      <option value="formal">Formal</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Product Stage
                    </label>
                    <select
                      name="currentStage"
                      value={formData.currentStage}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white dark:bg-gray-900"
                    >
                      <option value="idea">Idea</option>
                      <option value="mvp">MVP</option>
                      <option value="growth">Growth</option>
                      <option value="established">Established</option>
                      <option value="relaunch">Relaunch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Platforms
                  </label>
                  <div className="relative">
                    <select
                      name="platforms"
                      multiple
                      value={formData.platforms}
                      onChange={handleMultiSelectChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white dark:bg-gray-900"
                      size={4}
                    >
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="pinterest">Pinterest</option>
                    </select>
                    <div className="absolute right-2 top-2 flex items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {formData.platforms.length} selected
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Hold Ctrl/Cmd to select multiple platforms
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Industry
                    </label>
                    <select
                      name="industry"
                      multiple
                      value={formData.industry}
                      onChange={handleMultiSelectChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white dark:bg-gray-900"
                      size={5}
                    >
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="education">Education</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="media">Media & Entertainment</option>
                      <option value="food">Food & Beverage</option>
                      <option value="travel">Travel & Tourism</option>
                      <option value="realestate">Real Estate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Target Audience
                    </label>
                    <select
                      name="targetAudience"
                      multiple
                      value={formData.targetAudience}
                      onChange={handleMultiSelectChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white dark:bg-gray-900"
                      size={5}
                    >
                      <option value="professionals">Professionals</option>
                      <option value="students">Students</option>
                      <option value="parents">Parents</option>
                      <option value="elderly">Elderly</option>
                      <option value="business_owners">Business Owners</option>
                      <option value="executives">Executives</option>
                      <option value="millennials">Millennials</option>
                      <option value="gen_z">Gen Z</option>
                      <option value="gen_x">Gen X</option>
                      <option value="boomers">Baby Boomers</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-md shadow-md text-sm font-medium text-white transition-all duration-300 ${
                    isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transform hover:-translate-y-0.5'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating your marketing plan...
                    </span>
                  ) : (
                    'Generate Marketing Plan'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingPlannerPage;