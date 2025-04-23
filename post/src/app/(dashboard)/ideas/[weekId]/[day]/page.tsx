'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MarketingPlan, MarketingPlanWeek, MarketingPlanDay } from '@/lib/aiservice';

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const weekId = parseInt(params.weekId as string);
  const dayName = (params.day as string).charAt(0).toUpperCase() + (params.day as string).slice(1);
  
  // Keep marketing plan in state but mark it as intentionally unused
  const [_plan, setMarketingPlan] = useState<MarketingPlan | null>(null);
  const [week, setWeek] = useState<MarketingPlanWeek | null>(null);
  const [day, setDay] = useState<MarketingPlanDay | null>(null);
  
  useEffect(() => {
    // Load marketing plan from localStorage
    const savedPlan = localStorage.getItem('marketingPlan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        console.log(_plan);
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
  
  // Use plan data to determine if we have a properly loaded plan
  
  if (!week || !day) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white shadow-md rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h2 className="text-xl font-semibold text-center text-gray-700">Loading day activities...</h2>
        </div>
      </div>
    );
  }
  
  // Helper function to format activity type with color
  const getActivityTypeClass = (type: string) => {
    switch(type) {
      case 'post':
        return 'bg-blue-100 text-blue-800';
      case 'analysis':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to format description with paragraphs and lists
  const formatDescription = (description: string) => {
    // Split the description by newlines
    const paragraphs = description.split(/\n\n+/);
    
    return paragraphs.map((paragraph, i) => {
      // Check if this is a section heading
      if (paragraph.toUpperCase() === paragraph && paragraph.trim().length > 0) {
        return (
          <h3 key={i} className="font-bold text-gray-800 mt-4 mb-2">
            {paragraph}
          </h3>
        );
      }
      
      // Check if this section has numbered steps
      if (paragraph.match(/^\d+\.\s/)) {
        const steps = paragraph.split(/\n/).filter(s => s.trim().length > 0);
        return (
          <ol key={i} className="list-decimal pl-5 my-3 space-y-1">
            {steps.map((step, j) => {
              // Extract the number if present
              const stepText = step.replace(/^\d+\.\s/, '');
              return (
                <li key={j} className="text-gray-700">{stepText}</li>
              );
            })}
          </ol>
        );
      }
      
      // Check if this is a bullet list
      if (paragraph.match(/^[-•*]\s/)) {
        const bullets = paragraph.split(/\n/).filter(s => s.trim().length > 0);
        return (
          <ul key={i} className="list-disc pl-5 my-3 space-y-1">
            {bullets.map((bullet, j) => {
              // Remove the bullet character
              const bulletText = bullet.replace(/^[-•*]\s/, '');
              return (
                <li key={j} className="text-gray-700">{bulletText}</li>
              );
            })}
          </ul>
        );
      }
      
      // Regular paragraph
      return (
        <p key={i} className="text-gray-700 my-3">
          {paragraph}
        </p>
      );
    });
  };

  // Get the previous and next days
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const currentDayIndex = dayOrder.indexOf(dayName.toLowerCase());
  const prevDay = currentDayIndex > 0 ? dayOrder[currentDayIndex - 1] : null;
  const nextDay = currentDayIndex < dayOrder.length - 1 ? dayOrder[currentDayIndex + 1] : null;
  
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
            <Link href={`/ideas/${weekId}`} className="hover:text-blue-600 hover:underline">
              Week {weekId}
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-gray-900">{dayName}</span>
          </li>
        </ol>
      </nav>
      
      {/* Day header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-6 text-white mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-baseline">
            <h1 className="text-3xl font-bold">{dayName}</h1>
            <p className="ml-4 text-blue-100">Week {weekId}: {week.theme}</p>
          </div>
          <p className="text-blue-100 mt-2">
            {day.activities.length} detailed marketing activities for {dayName.toLowerCase()}
          </p>
        </div>
      </div>
      
      {/* Day activities */}
      <div className="max-w-4xl mx-auto space-y-8">
        {day.activities.map((activity, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-800">{activity.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActivityTypeClass(activity.type)}`}>
                  {activity.type}
                </span>
              </div>
              {activity.platform && (
                <div className="mt-2 text-sm font-medium text-blue-600">
                  Platform: {activity.platform}
                </div>
              )}
            </div>
            
            <div className="p-5">
              <div className="prose max-w-none">
                {formatDescription(activity.description)}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Link 
                  href={`/ideas/${weekId}/${dayName.toLowerCase()}/prompt`}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate Content
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation */}
      <div className="max-w-4xl mx-auto mt-10 flex justify-between">
        {prevDay ? (
          <Link 
            href={`/ideas/${weekId}/${prevDay}`} 
            className="flex items-center px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {prevDay.charAt(0).toUpperCase() + prevDay.slice(1)}
          </Link>
        ) : (
          <div></div> // Empty div for spacing
        )}
        
        <Link 
          href={`/ideas/${weekId}`} 
          className="flex items-center px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Back to Week {weekId}
        </Link>
        
        {nextDay ? (
          <Link 
            href={`/ideas/${weekId}/${nextDay}`} 
            className="flex items-center px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700"
          >
            {nextDay.charAt(0).toUpperCase() + nextDay.slice(1)}
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div></div> // Empty div for spacing
        )}
      </div>
    </div>
  );
} 