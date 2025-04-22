'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MarketingPlan, MarketingPlanWeek, MarketingPlanDay } from '@/lib/aiservice';
import { exportToPDF, exportToJSON, exportToText } from '@/lib/exportUtils';

export default function PromptPage() {
  const params = useParams();
  const router = useRouter();
  const weekId = parseInt(params.weekId as string);
  const dayName = (params.day as string).charAt(0).toUpperCase() + (params.day as string).slice(1);
  
  const [marketingPlan, setMarketingPlan] = useState<MarketingPlan | null>(null);
  const [week, setWeek] = useState<MarketingPlanWeek | null>(null);
  const [day, setDay] = useState<MarketingPlanDay | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    activityId: '',
    customPrompt: '',
    temperature: 0.7,
    outputLength: 'medium'
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  useEffect(() => {
    // Load marketing plan from localStorage
    const savedPlan = localStorage.getItem('marketingPlan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        setMarketingPlan(plan);
        
        // Find the specific week
        const foundWeek = plan.weeks.find((w: MarketingPlanWeek) => w.weekNumber === weekId);
        if (foundWeek) {
          setWeek(foundWeek);
          
          // Find the specific day
          const foundDay = foundWeek.days.find((d: MarketingPlanDay) => 
            d.dayName.toLowerCase() === dayName.toLowerCase()
          );
          
          if (foundDay) {
            setDay(foundDay);
            // Set the first activity as default
            if (foundDay.activities.length > 0) {
              setFormData(prev => ({
                ...prev,
                activityId: '0'
              }));
            }
          } else {
            // Day not found, redirect back to week
            router.push(`/ideas/${weekId}`);
          }
        } else {
          // Week not found, redirect back to ideas
          router.push('/ideas');
        }
      } catch (e) {
        console.error('Error parsing saved marketing plan:', e);
        router.push('/ideas');
      }
    } else {
      // No saved plan, redirect to ideas
      router.push('/ideas');
    }
  }, [weekId, dayName, router]);
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setGeneratedContent('');
    
    try {
      // Get the selected activity
      if (!day || !formData.activityId) {
        throw new Error('No activity selected');
      }
      
      const activityIndex = parseInt(formData.activityId);
      const activity = day.activities[activityIndex];
      
      if (!activity) {
        throw new Error('Invalid activity selected');
      }
      
      // Construct prompt based on the activity
      const promptContext = {
        activity,
        customPrompt: formData.customPrompt,
        temperature: formData.temperature,
        outputLength: formData.outputLength,
        day: dayName,
        week: week,
        marketingPlan
      };
      
      // Call API to generate content
      const response = await fetch('/api/generate-prompt-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promptContext)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      const data = await response.json();
      setGeneratedContent(data.content);
      
      // Save the generated content to localStorage with the activity
      const savedContents = JSON.parse(localStorage.getItem('generatedContents') || '{}');
      savedContents[`${weekId}-${dayName}-${activity.title}`] = data.content;
      localStorage.setItem('generatedContents', JSON.stringify(savedContents));
      
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExport = () => {
    setExportLoading(true);
    
    try {
      if (!day || !generatedContent) {
        setError('No content to export');
        return;
      }
      
      // Create a structured data item for export
      const exportItem = {
        id: `${weekId}-${dayName}-${day.activities[parseInt(formData.activityId)].title}`,
        content: day.activities[parseInt(formData.activityId)].description,
        generatedContent: generatedContent,
        type: day.activities[parseInt(formData.activityId)].type,
        platform: day.activities[parseInt(formData.activityId)].platform || 'All platforms',
        week: weekId,
        day: dayName
      };
      
      const title = `Week ${weekId} - ${dayName} - ${day.activities[parseInt(formData.activityId)].title}`;
      
      switch (exportFormat) {
        case 'pdf':
          exportToPDF([exportItem], title);
          break;
        case 'json':
          exportToJSON([exportItem], title);
          break;
        case 'text':
          exportToText([exportItem], title);
          break;
        default:
          exportToPDF([exportItem], title);
      }
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export content');
    } finally {
      setExportLoading(false);
    }
  };
  
  if (!week || !day) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white shadow-md rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h2 className="text-xl font-semibold text-center text-gray-700">Loading activity data...</h2>
        </div>
      </div>
    );
  }
  
  const formattedGeneratedContent = generatedContent.split('\n').map((line, index) => (
    <p key={index} className="mb-2">{line}</p>
  ));
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
        <ol className="flex flex-wrap items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/ideas" className="hover:text-blue-600 hover:underline">
              Marketing Plan
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/ideas/${weekId}`} className="hover:text-blue-600 hover:underline">
              Week {weekId}
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/ideas/${weekId}/${dayName.toLowerCase()}`} className="hover:text-blue-600 hover:underline">
              {dayName}
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-gray-900">Content Generator</span>
          </li>
        </ol>
      </nav>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 text-white mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-baseline">
            <h1 className="text-3xl font-bold">Content Generator</h1>
            <p className="md:ml-4 text-purple-100">{dayName}, Week {weekId}</p>
          </div>
          <p className="text-purple-100 mt-2">
            Generate detailed content for your marketing activities
          </p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Generation Settings</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Activity
                </label>
                <select
                  name="activityId"
                  value={formData.activityId}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>Select an activity</option>
                  {day.activities.map((activity, index) => (
                    <option key={index} value={index.toString()}>
                      {activity.title} ({activity.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  name="customPrompt"
                  value={formData.customPrompt}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Add specific instructions or requirements for the content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Creativity Level
                </label>
                <input
                  type="range"
                  name="temperature"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={handleFormChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Focused</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Length
                </label>
                <select
                  name="outputLength"
                  value={formData.outputLength}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="short">Short (100-200 words)</option>
                  <option value="medium">Medium (300-500 words)</option>
                  <option value="long">Long (600+ words)</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !formData.activityId}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || !formData.activityId ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isLoading ? 'Generating...' : 'Generate Content'}
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 bg-white rounded-lg shadow-md p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Selected Activity</h2>
            {formData.activityId !== '' && day.activities[parseInt(formData.activityId)] ? (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">
                    {day.activities[parseInt(formData.activityId)].title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    day.activities[parseInt(formData.activityId)].type === 'post' 
                      ? 'bg-blue-100 text-blue-800' 
                      : day.activities[parseInt(formData.activityId)].type === 'analysis'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {day.activities[parseInt(formData.activityId)].type}
                  </span>
                </div>
                {day.activities[parseInt(formData.activityId)].platform && (
                  <p className="text-sm text-blue-600 mb-2">
                    Platform: {day.activities[parseInt(formData.activityId)].platform}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {day.activities[parseInt(formData.activityId)].description}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Select an activity to see details</p>
            )}
          </div>
        </div>
        
        {/* Results section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md h-full">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-xl font-bold text-gray-800">Generated Content</h2>
              <p className="text-sm text-gray-500">Content will appear here after generation</p>
            </div>
            
            <div className="p-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600">Generating your content...</p>
                </div>
              ) : generatedContent ? (
                <div className="prose max-w-none">
                  {formattedGeneratedContent}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-center">
                    Select an activity and click Generate Content <br />
                    to create custom content for your marketing plan
                  </p>
                </div>
              )}
            </div>
            
            {generatedContent && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent);
                      alert('Content copied to clipboard!');
                    }}
                    className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy to Clipboard
                  </button>
                  
                  <button
                    onClick={() => setGeneratedContent('')}
                    className="flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded text-sm text-red-700"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="max-w-4xl mx-auto mt-8">
        <Link 
          href={`/ideas/${weekId}/${dayName.toLowerCase()}`} 
          className="flex items-center px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 w-fit"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {dayName}s Activities
        </Link>
      </div>
      
      {/* Export section */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Export Content</h2>
          
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            >
              <option value="pdf">PDF Format</option>
              <option value="json">JSON Format</option>
              <option value="text">Text Format</option>
            </select>
            
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {exportLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
        
        {exportSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Content exported successfully!
          </div>
        )}
      </div>
    </div>
  );
} 