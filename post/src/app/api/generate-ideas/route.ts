import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Content from '@/models/Content';
import { generateIdeasWithAI } from '@/lib/aiservice';

export async function POST(req: NextRequest) {
  try {
    const { tone, numberOfIdeas, platform, productDescription } = await req.json();

    if (!tone || !platform || !productDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const relevantContent = await Content.find({ 
      platform: platform.toLowerCase()
    })
    .sort({ 
      'engagement.engagementScore': -1 
    })
    .limit(20)
    .lean();

    interface PlatformData {
      contentTypes: { [key: string]: number };
      marketingPatterns: { [key: string]: number };
      formatPatterns: { [key: string]: number };
      avgPostLength: number;
      totalContent: number;
    }

    const platformSpecificData: PlatformData = {
      contentTypes: {},
      marketingPatterns: {},
      formatPatterns: {},
      avgPostLength: 0,
      totalContent: relevantContent.length
    };

    let totalLength = 0;
    
    // Only process content data if we have relevant examples
    if (relevantContent.length > 0) {
      relevantContent.forEach((content : any) => {
        // Count content types
        if (platformSpecificData.contentTypes[content.contentType]) {
          platformSpecificData.contentTypes[content.contentType]++;
        } else {
          platformSpecificData.contentTypes[content.contentType] = 1;
        }
        
        // Count marketing patterns
        content.marketingPatterns.forEach((pattern : any) => {
          if (platformSpecificData.marketingPatterns[pattern]) {
            platformSpecificData.marketingPatterns[pattern]++;
          } else {
            platformSpecificData.marketingPatterns[pattern] = 1;
          }
        });
        
        // Count format details
        Object.entries(content.format).forEach(([key, value]) => {
          if (typeof value === 'boolean' && value === true) {
            if (platformSpecificData.formatPatterns[key]) {
              platformSpecificData.formatPatterns[key]++;
            } else {
              platformSpecificData.formatPatterns[key] = 1;
            }
          }
        });
        
        // Calculate average post length
        totalLength += content.content.length;
      });
      
      platformSpecificData.avgPostLength = Math.round(totalLength / relevantContent.length);
    } else {
      // Provide some default values when no content exists
      platformSpecificData.contentTypes = { 'promotional': 1, 'educational': 1, 'entertaining': 1 };
      platformSpecificData.marketingPatterns = { 'question': 1, 'call-to-action': 1, 'how-to': 1 };
      platformSpecificData.formatPatterns = { 'hasLinks': 1, 'hasCTA': 1, 'hashtags': 1 };
      platformSpecificData.avgPostLength = platform === 'twitter' ? 200 : 500;
    }

    // Get top performing examples (up to 3) or provide empty array if none
    const topExamples = relevantContent.length > 0 
      ? relevantContent.slice(0, 3).map((c: any) => c.content)
      : [];

    // Always use the AI generation, even if there's no database content to learn from
    const ideas = await generateIdeasWithAI({
      tone,
      numberOfIdeas,
      platform,
      productDescription,
      platformData: platformSpecificData,
      topExamples
    });

    return NextResponse.json({ 
      ideas,
      platformData: platformSpecificData,
      examplesUsed: relevantContent.length
    });
  } catch (error) {
    console.error('Error generating ideas:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}