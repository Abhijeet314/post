'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MarketingPlan, MarketingPlanWeek } from '@/lib/aiservice';

export default function WeekPage() {
  const params = useParams();
  const router = useRouter();
  const weekId = parseInt(params.weekId as string);
  
  // Keep marketing plan in state but mark it as intentionally unused
  const [_plan, setMarketingPlan] = useState<MarketingPlan | null>(null);
  const [week, setWeek] = useState<MarketingPlanWeek | null>(null);
  
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
        } else {
          // Week not found, redirect back
          router.push('/ideas');
        }
      } catch (e) {
        console.error('Error parsing saved marketing plan:', e);
        router.push('/ideas');
      }
    } else {
      // No saved plan, redirect back
      router.push('/ideas');
    }
  }, [weekId, router]);
  
  if (!week) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white shadow-md rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h2 className="text-xl font-semibold text-center text-gray-700">Loading week data...</h2>
        </div>
      </div>
    );
  }
  
  // Sort days in correct order
  const sortedDays = [...week.days].sort((a, b) => {
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
    return dayOrder[a.dayName as keyof typeof dayOrder] - dayOrder[b.dayName as keyof typeof dayOrder];
  });
  
  // Calculate total activities
  const totalActivities = sortedDays.reduce((sum, day) => sum + day.activities.length, 0);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/ideas" className="hover:text-blue-600 hover:underline">
              Marketing Plan
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-gray-900">Week {week.weekNumber}</span>
          </li>
        </ol>
      </nav>
      
      {/* Week header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-md p-6 text-white mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Week {week.weekNumber}: {week.theme}</h1>
          <p className="text-blue-100 mb-4">{totalActivities} activities across {sortedDays.length} days</p>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-2">Week Goals:</h2>
            <ul className="list-disc pl-5 space-y-1">
              {week.goals.map((goal, index) => (
                <li key={index} className="text-blue-50">{goal}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Week description */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">About This Week</h2>
          <p className="text-gray-600">
            Week {week.weekNumber} focuses on <span className="font-medium">{week.theme}</span>. This phase of your marketing plan 
            contains {totalActivities} detailed activities spread across {sortedDays.length} days to help you 
            {week.weekNumber === 1 ? ' establish initial marketing foundations' : 
             week.weekNumber === 2 ? ' build on your initial efforts' : 
             week.weekNumber === 3 ? ' accelerate your marketing momentum' : 
             ' optimize and refine your strategy'}.
          </p>
          
          <div className="mt-4 bg-indigo-50 p-4 rounded-md border border-indigo-100">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h3 className="font-medium text-indigo-800">Content Generation Available</h3>
                <p className="text-sm text-indigo-700 mt-1">
                  You can now generate detailed content for any activity in this plan. Just click 
                  Generate Content on any days activities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Days grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedDays.map((day) => (
          <Link href={`/ideas/${weekId}/${day.dayName.toLowerCase()}`} key={day.dayName} className="block">
            <div className="bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden h-full">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h3 className="text-xl font-bold text-gray-800">{day.dayName}</h3>
                <p className="text-sm text-blue-700">{day.activities.length} activities</p>
              </div>
              
              <div className="p-5">
                <ul className="space-y-3">
                  {day.activities.map((activity, i) => (
                    <li key={i} className="flex items-start">
                      <div className={`w-3 h-3 rounded-full mt-1.5 mr-2 
                        ${activity.type === 'post' ? 'bg-blue-500' : 
                          activity.type === 'analysis' ? 'bg-purple-500' : 'bg-gray-500'}`} 
                      />
                      <div>
                        <h4 className="font-medium text-gray-800 line-clamp-1">{activity.title}</h4>
                        <p className="text-xs text-gray-500 uppercase">{activity.type}{activity.platform ? ` • ${activity.platform}` : ''}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 text-blue-600 text-sm flex items-center">
                  View detailed activities
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="max-w-4xl mx-auto mt-10 flex justify-between">
        {weekId > 1 && (
          <Link href={`/ideas/${weekId - 1}`} className="flex items-center px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Week {weekId - 1}
          </Link>
        )}
        
        <Link href="/ideas" className="flex items-center px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          All Weeks
        </Link>
        
        {weekId < 4 && (
          <Link href={`/ideas/${weekId + 1}`} className="flex items-center px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700">
            Week {weekId + 1}
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
} 