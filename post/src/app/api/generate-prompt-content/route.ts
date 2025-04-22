import { NextResponse } from 'next/server';
import Together from "together-ai";

// Use an explicit API key instead of relying on automatic environment variable detection
const apiKey = process.env.TOGETHER_API_KEY || '';
const together = new Together({ apiKey });

interface Activity {
  title: string;
  description: string;
  type?: string;
  platform?: string;
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    
    const { 
      activity, 
      customPrompt, 
      temperature, 
      outputLength, 
      day, 
      week, 
      marketingPlan 
    } = requestData;
    
    // Input validation
    if (!activity || !activity.title || !activity.description) {
      return NextResponse.json({ error: 'Invalid activity data' }, { status: 400 });
    }
    
    // Construct base prompt from activity data
    const prompt = constructPrompt(
      activity, 
      customPrompt, 
      outputLength, 
      day, 
      week?.theme, 
      week?.weekNumber,
      marketingPlan?.title
    );
    
    // Generate content with Together AI
    const response = await together.chat.completions.create({
      messages: [{"role": "user", "content": prompt}],
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      temperature: parseFloat(temperature) || 0.7,
      max_tokens: getMaxTokensByLength(outputLength)
    });
    

    const content = response.choices[0]?.message?.content || '';
    
    // Return generated content
    return NextResponse.json({ content });
    
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' }, 
      { status: 500 }
    );
  }
}

function constructPrompt(
  activity: Activity, 
  customPrompt: string, 
  outputLength: string, 
  day: string,
  weekTheme?: string,
  weekNumber?: number,
  planTitle?: string
): string {
  const activityType = activity.type || 'task';
  const platform = activity.platform || '';
  
  let basePrompt = `You are a professional content creator helping with a marketing plan. 
  
Marketing Plan Context:
${planTitle ? `- Plan Title: ${planTitle}` : ''}
${weekNumber ? `- Week ${weekNumber}${weekTheme ? `: ${weekTheme}` : ''}` : ''}
- Day: ${day}

The activity details are:
- Title: ${activity.title}
- Type: ${activityType}${platform ? `\n- Platform: ${platform}` : ''}
- Description: ${activity.description}

IMPORTANT INSTRUCTIONS:
- Generate HIGHLY DETAILED, practical, and ready-to-use content for this activity
- Create clear, specific information that can be immediately implemented
- Focus on actionable details, not generic advice
- Include specific examples relevant to the activity
- Format your response with clear sections and paragraphs`;

  // Add specific instructions based on activity type
  if (activityType === 'post') {
    basePrompt += `\n\nFor this ${platform ? platform + ' ' : ''}post, include:
- The complete, ready-to-publish post content
- Suggested visuals/media to accompany the post
- 3-5 relevant hashtags
- Best time to post for maximum engagement
- Follow-up engagement strategies
- Tips for measuring the post's performance`;
  } else if (activityType === 'analysis') {
    basePrompt += `\n\nProvide a comprehensive analysis guide that includes:
- Specific metrics to track with exact KPIs
- Step-by-step instructions for gathering data
- Tools and techniques for effective analysis
- How to interpret different data scenarios
- Actionable insights based on potential findings
- Recommendations for optimization with specific examples
- Timeline for implementing changes based on the analysis`;
  } else {
    basePrompt += `\n\nCreate detailed task implementation guidelines that include:
- Clear step-by-step instructions with timeframes for each step
- Required resources, tools, and software
- Potential challenges and how to overcome them
- Success metrics to track effectiveness
- How to integrate this task with other marketing activities
- Timeline for preparation, execution, and evaluation`;
  }
  
  // Add length specifications
  basePrompt += `\n\nOutput Length: ${getLengthDescription(outputLength)}`;
  
  // Add custom prompt if provided
  if (customPrompt && customPrompt.trim()) {
    basePrompt += `\n\nAdditional requirements: ${customPrompt.trim()}`;
  }
  
  return basePrompt;
}

function getLengthDescription(length: string): string {
  switch (length) {
    case 'short':
      return 'Brief and concise (100-200 words)';
    case 'medium':
      return 'Moderately detailed (300-500 words)';
    case 'long':
      return 'Comprehensive and in-depth (600+ words)';
    default:
      return 'Moderately detailed (300-500 words)';
  }
}

function getMaxTokensByLength(length: string): number {
  switch (length) {
    case 'short':
      return 250;
    case 'medium':
      return 650;
    case 'long':
      return 1200;
    default:
      return 650;
  }
} 