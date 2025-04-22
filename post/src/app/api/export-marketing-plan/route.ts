import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { marketingPlan, generatedContents } = await req.json();
    
    if (!marketingPlan) {
      return NextResponse.json(
        { error: 'No marketing plan provided' },
        { status: 400 }
      );
    }
    
    // Prepare export data
    const exportItems = [];
    
    // Process each week and day to create structured export items
    for (const week of marketingPlan.weeks) {
      for (const day of week.days) {
        for (const activity of day.activities) {
          // Create a unique ID for the activity
          const activityId = `${week.weekNumber}-${day.dayName}-${activity.title}`;
          
          // Check if we have generated content for this activity
          const generatedContent = generatedContents?.[activityId] || null;
          
          exportItems.push({
            id: activityId,
            content: activity.description,
            generatedContent: generatedContent,
            type: activity.type,
            platform: activity.platform || 'All platforms',
            week: week.weekNumber,
            day: day.dayName
          });
        }
      }
    }
    
    // Return the prepared export data
    return NextResponse.json({
      success: true,
      items: exportItems,
      title: marketingPlan.title || 'Marketing Plan'
    });
    
  } catch (error) {
    console.error('Error processing marketing plan export:', error);
    return NextResponse.json(
      { error: 'Failed to process marketing plan export' },
      { status: 500 }
    );
  }
} 