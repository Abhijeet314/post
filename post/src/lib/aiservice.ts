import Together from "together-ai";

// Define interface for platform data
interface PlatformData {
  contentTypes: { [key: string]: number };
  marketingPatterns: { [key: string]: number };
  formatPatterns: { [key: string]: number };
  avgPostLength: number;
  totalContent: number;
}

interface GenerateIdeasParams {
  tone: string;
  numberOfIdeas: number;
  platform: string;
  productDescription: string;
  platformData?: PlatformData;
  topExamples?: string[];
}

// Use an explicit API key instead of relying on automatic environment variable detection
const apiKey = process.env.TOGETHER_API_KEY || '';
const together = new Together({ apiKey });

export async function generateIdeasWithAI({
  tone,
  numberOfIdeas,
  platform,
  productDescription,
  platformData,
  topExamples = []
}: GenerateIdeasParams) {
  try {
    // Construct the prompt
    const prompt = constructPrompt({
      tone,
      numberOfIdeas,
      platform,
      productDescription,
      platformData,
      topExamples
    });

    // Generate content with Together AI
    const response = await together.chat.completions.create({
      messages: [{"role": "user", "content": prompt}],
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    });

    const generatedText = response.choices[0]?.message?.content || '';

    // Parse ideas from the generated text
    const ideas = parseGeneratedIdeas(generatedText, numberOfIdeas);

    return ideas.map(content => ({
      id: generateId(),
      content,
      platform
    }));

  } catch (error) {
    console.error('Error generating ideas with Together AI:', error);
    return generateFallbackIdeas({
      tone,
      numberOfIdeas,
      platform,
      productDescription
    });
  }
}

/**
 * Generates an image using Together AI FLUX model based on content description
 * @param content The text content to generate an image for
 * @param platform The social media platform context
 * @returns A data URL string containing the base64-encoded image, or null if failed
 */
export async function generateImageWithAI(content: string, platform: string): Promise<string | null> {
  try {
    // Create an improved image prompt that ensures English-only text and uses post content
    const imagePrompt = `Create a visually engaging image for a ${platform} post with the following requirements:
1. The image should be directly related to this content: "${content.substring(0, 200)}"
2. ANY text included in the image MUST be in English only
3. Use modern, professional design that would appeal to ${platform} users
4. If you include text elements, keep them minimal and only use key phrases from the content
5. DO NOT include any non-English text or gibberish text
6. Create a composition that complements this exact message: "${content.substring(0, 100)}..."`;
    
    const response = await together.images.create({
      model: "black-forest-labs/FLUX.1-dev",
      prompt: imagePrompt,
      width: 1024,
      height: 768,
      steps: 28,
      n: 1,
      response_format: "base64" as const
    });
    
    // Convert base64 image to a data URL
    const imageBase64 = response.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating image with Together AI:', error);
    return null;
  }
}

function constructPrompt({
  tone,
  numberOfIdeas,
  platform,
  productDescription,
  platformData,
  topExamples
}: GenerateIdeasParams): string {
  let prompt = `You are an elite-tier ${platform} marketing expert with exceptional creativity

MISSION: Generate ${numberOfIdeas} unique, engaging, and high-converting ${platform} content ideas that will go viral.

PRODUCT DETAILS:
${productDescription}

TONE: ${tone}
${getToneGuidelines(tone)}

PLATFORM: ${platform}
${getPlatformGuidelines(platform)}`;

  if (platformData) {
    prompt += `

PLATFORM ANALYTICS (Use these insights for maximum engagement):
• Average post length: ${platformData.avgPostLength} characters
• Most effective content types: ${Object.entries(platformData.contentTypes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type]) => type)
      .join(', ')}
• Best performing patterns: ${Object.entries(platformData.marketingPatterns)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([pattern]) => pattern)
      .join(', ')}`;
  }

if ((topExamples?.length ?? 0) > 0) {
  prompt += `

HIGH-PERFORMING EXAMPLES (Model your ideas after these winners):
${(topExamples || []).map((example, index) => `${index + 1}. "${example}"`).join('\n')}`;
}

  prompt += `

REQUIREMENTS:
1. Generate EXACTLY ${numberOfIdeas} unique, creative, and attention-grabbing ideas
2. Each idea should be platform-optimized for ${platform}'s algorithm and user behavior
3. Follow the specified "${tone}" tone consistently with perfect execution
4. Include compelling calls-to-action that drive engagement
5. Format each idea with a number (1., 2., etc.) for clarity
6. DO NOT use any emojis in the content - text only
7. Create ideas that stand out from competitors and stop users from scrolling
8. Balance creativity with conversion potential
9. STRICTLY RESPECT ${platform} character limits
   - For Twitter: maximum 280 characters per post
   - For LinkedIn: professional tone, under 1300 characters for optimal display
   - For Instagram: under 2200 characters, focus on visual descriptions
   - For other platforms: appropriate length for optimal engagement

Now, create exactly ${numberOfIdeas} ${platform} content ideas with clear numbering:`;

  return prompt;
}

function parseGeneratedIdeas(text: string, expectedCount: number): string[] {
  // Try to match numbered ideas first (like "1. idea text")
  const regex = /(?:\d+[\.\)]\s*)([^0-9]+?)(?=\n\s*\d+[\.\)]|$)/g;
  let matches = [...text.matchAll(regex)];
  
  // If we didn't find enough matches, try with a more lenient regex
  if (matches.length < expectedCount) {
    const lenientRegex = /(?:\d+[\.\)]\s*)(.+?)(?=\n\s*\d+[\.\)]|$)/g;
    matches = [...text.matchAll(lenientRegex)];
  }
  
  if (matches.length > 0) {
    return matches
      .map(match => match[1].trim())
      .filter(idea => idea.length > 0)
      .slice(0, expectedCount);
  }
  
  // Fallback to paragraph splitting
  return text
    .split(/\n\s*\n/)
    .map(idea => idea.trim())
    .filter(idea => idea.length > 0)
    .slice(0, expectedCount);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function getToneGuidelines(tone: string): string {
  switch(tone.toLowerCase()) {
    case 'professional':
      return "Use formal language, industry terminology, and focus on data-driven insights";
    case 'casual':
      return "Write in a conversational, friendly manner as if chatting with a friend";
    case 'sarcastic':
      return "Employ witty observations and clever wordplay, maintaining professionalism";
    case 'humorous':
      return "Include appropriate jokes and lighthearted content while staying on message";
    default:
      return "Maintain clear, engaging, and direct communication";
  }
}

function getPlatformGuidelines(platform: string): string {
  switch(platform.toLowerCase()) {
    case 'twitter':
      return `Guidelines:
- Maximum 280 characters
- Use 1-2 relevant hashtags
- Create engaging hooks
- Consider thread potential`;
    case 'linkedin':
      return `Guidelines:
- Professional tone
- Clear paragraph structure
- Industry insights
- Encourage professional discussion`;
    case 'instagram':
      return `Guidelines:
- Visual-first descriptions
- Strategic emoji use
- Strong opening hook
- 3-5 relevant hashtags`;
    case 'youtube':
      return `Guidelines:
- Attention-grabbing titles
- Clear value proposition
- SEO-friendly descriptions
- Strong call-to-action`;
    default:
      return "Focus on clear messaging and relevant calls-to-action";
  }
}

export function generateFallbackIdeas({
  tone,
  numberOfIdeas,
  platform,
  productDescription
}: Omit<GenerateIdeasParams, 'platformData' | 'topExamples'>) {
  const templates = {
    professional: [
      "Introducing our solution that helps professionals optimize workflow efficiency",
      "Did you know that businesses lose over 20% of productive time to inefficient processes?",
      "Here's how our customers are improving ROI with our product",
      "Want to streamline your operations? Here's how we can help",
      "The data-driven approach to improving your business performance"
    ],
    casual: [
      "This tool will make your life so much easier!",
      "Most people waste hours every week on tasks that could be automated",
      "Ready to save time and reduce stress? Here's how",
      "The simple solution to your biggest daily challenge",
      "Transform your workflow with this game-changing tool"
    ]
  };

  const selectedTemplates = templates[tone as keyof typeof templates] || templates.professional;
  const shuffled = [...selectedTemplates].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, numberOfIdeas).map(content => ({
    id: generateId(),
    content: adaptContentToPlatform(content, platform),
    platform
  }));
}

function adaptContentToPlatform(content: string, platform: string): string {
  switch(platform.toLowerCase()) {
    case 'twitter':
      return content.length > 280 ? content.substring(0, 277) + '...' : content;
    case 'linkedin':
      return `${content}\n\nWhat challenges are you facing in this area? Share your thoughts below. #BusinessGrowth`;
    case 'instagram':
      return `✨ ${content} ✨\n\n#business #growth #success`;
    case 'youtube':
      return `How to: ${content.toUpperCase()} [Complete Guide]`;
    default:
      return content;
  }
}

/**
 * Interface for marketing plan generation parameters
 */
export interface MarketingPlanParams {
  tone: string;
  platforms: string[];
  productDescription: string;
  industry: string[];
  targetAudience: string[];
  usp: string;
  currentStage: string;
}

/**
 * Structure of a day in the marketing plan
 */
export interface MarketingPlanDay {
  dayName: string;
  activities: {
    title: string;
    description: string;
    platform?: string;
    type: 'post' | 'task' | 'analysis';
  }[];
}

/**
 * Structure of a week in the marketing plan
 */
export interface MarketingPlanWeek {
  weekNumber: number;
  theme: string;
  goals: string[];
  days: MarketingPlanDay[];
}

/**
 * Structure of the complete marketing plan
 */
export interface MarketingPlan {
  title: string;
  overview: string;
  weeks: MarketingPlanWeek[];
}

/**
 * Parses the marketing plan from the generated text
 */
function parseMarketingPlan(text: string, params: MarketingPlanParams): MarketingPlan {
  try {
    // Clean the text by removing any markdown symbols or artifacts
    const cleanedText = text
      .replace(/\*\*/g, '')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '');
    
    // Best-effort parsing of the generated text to extract a structured marketing plan
    const lines = cleanedText.split('\n').filter(line => line.trim().length > 0);
    
    // Extract title and overview
    const title = lines[0] || '4-Week Marketing Plan';
    const overviewLines = [];
    let currentIndex = 1;
    
    // Find where the overview ends and week 1 begins
    while (currentIndex < lines.length && !lines[currentIndex].toLowerCase().includes('week 1')) {
      overviewLines.push(lines[currentIndex]);
      currentIndex++;
    }
    
    const overview = overviewLines.join('\n');
    
    // Parse weeks
    const weeks: MarketingPlanWeek[] = [];
    let currentWeek: Partial<MarketingPlanWeek> | null = null;
    let currentDay: Partial<MarketingPlanDay> | null = null;
    let weekCounter = 0; // Keep track of week count
    
    for (let i = currentIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Week header
      if (line.toLowerCase().includes('week') && /week\s+[1-4]/i.test(line)) {
        if (currentWeek && Object.keys(currentWeek).length > 0) {
          if (currentDay && Object.keys(currentDay).length > 0) {
            if (!currentWeek.days) currentWeek.days = [];
            currentWeek.days.push(currentDay as MarketingPlanDay);
          }
          weeks.push(currentWeek as MarketingPlanWeek);
        }
        
        weekCounter++; // Increment week counter
        
        // Extract week number and theme
        const weekNumberMatch = line.match(/week\s+(\d+)/i);
        let weekNumber = weekNumberMatch ? parseInt(weekNumberMatch[1]) : weekCounter;
        
        // Ensure week number is valid (1-4)
        if (weekNumber < 1 || weekNumber > 4) {
          weekNumber = weekCounter;
        }
        
        // Extract theme after the colon or from the whole line if no colon
        const themePart = line.includes(':') ? line.split(':')[1]?.trim() : line.replace(/week\s+\d+/i, '').trim();
        const theme = themePart || `Week ${weekNumber}`;
        
        currentWeek = {
          weekNumber,
          theme,
          goals: [],
          days: []
        };
        currentDay = null;
      }
      // Goals section
      else if ((line.toLowerCase().includes('goals:') || line.toLowerCase() === 'goals') && currentWeek) {
        let j = i + 1;
        while (j < lines.length && 
              (/^[-*•]\s+|^\d+\.\s+/.test(lines[j]) || !lines[j].match(/^(monday|tuesday|wednesday|thursday|friday):/i))) {
          const goalLine = lines[j].trim();
          // Skip if this line looks like a day header
          if (/^(monday|tuesday|wednesday|thursday|friday):/i.test(goalLine)) {
            break;
          }
          // Only include lines that look like bullet points or numbered items
          if (/^[-*•]\s+|^\d+\.\s+/.test(goalLine)) {
            currentWeek.goals?.push(goalLine.replace(/^[-*•]\s+|^\d+\.\s+/, '').trim());
          } else if (goalLine.length > 0 && !goalLine.toLowerCase().includes('week') && j > i + 1) {
            // If not a bullet but seems like continuation of previous goal
            const lastIndex = (currentWeek.goals?.length || 0) - 1;
            if (lastIndex >= 0 && currentWeek.goals) {
              currentWeek.goals[lastIndex] = `${currentWeek.goals[lastIndex]} ${goalLine}`;
            }
          }
          j++;
        }
        i = j - 1; // Skip processed lines
      }
      // Day header
      else if (/^(monday|tuesday|wednesday|thursday|friday):/i.test(line) && currentWeek) {
        if (currentDay && Object.keys(currentDay).length > 0) {
          if (!currentWeek.days) currentWeek.days = [];
          currentWeek.days.push(currentDay as MarketingPlanDay);
        }
        
        const dayName = line.split(':')[0].trim();
        currentDay = {
          dayName,
          activities: []
        };
      }
      // Activity
      else if (/^[-*•]\s+|^\d+\.\s+/.test(line) && currentDay) {
        const activityText = line.replace(/^[-*•]\s+|^\d+\.\s+/, '').trim();
        
        // Try to extract title and description
        const titleMatch = activityText.match(/^([^:]+):\s*(.+)$/);
        let title = titleMatch ? titleMatch[1].trim() : activityText;
        let description = titleMatch ? titleMatch[2].trim() : '';
        
        if (!description && title.includes(' - ')) {
          const parts = title.split(' - ');
          title = parts[0].trim();
          description = parts.slice(1).join(' - ').trim();
        }
        
        // If there's still no description, use the title as description and create a more appropriate title
        if (!description) {
          description = title;
          // Extract a shorter title from the description
          if (title.length > 30) {
            const shortTitle = title.substring(0, 30).split(' ').slice(0, -1).join(' ');
            title = shortTitle;
          }
        }
        
        // Check for any continued lines (additional description)
        let j = i + 1;
        while (j < lines.length && 
              !lines[j].trim().match(/^[-*•]\s+|^\d+\.\s+/) && 
              !lines[j].trim().match(/^(monday|tuesday|wednesday|thursday|friday):/i) &&
              !lines[j].trim().match(/week\s+[1-4]/i)) {
          const continuedLine = lines[j].trim();
          if (continuedLine.length > 0) {
            description += ' ' + continuedLine;
          }
          j++;
        }
        if (j > i + 1) {
          i = j - 1; // Skip the processed continuation lines
        }
        
        // Determine activity type and platform
        let type: 'post' | 'task' | 'analysis' = 'task';
        let platform: string | undefined = undefined;
        
        if (activityText.toLowerCase().includes('post') || 
            activityText.toLowerCase().includes('content') || 
            activityText.toLowerCase().includes('share') ||
            activityText.toLowerCase().includes('publish')) {
          type = 'post';
          // Try to determine platform
          for (const p of params.platforms) {
            if (activityText.toLowerCase().includes(p.toLowerCase())) {
              platform = p;
              break;
            }
          }
        } else if (activityText.toLowerCase().includes('analytics') || 
                   activityText.toLowerCase().includes('review') ||
                   activityText.toLowerCase().includes('data') ||
                   activityText.toLowerCase().includes('measure') ||
                   activityText.toLowerCase().includes('performance') ||
                   activityText.toLowerCase().includes('report')) {
          type = 'analysis';
        }
        
        currentDay.activities?.push({
          title,
          description,
          platform,
          type
        });
      }
    }
    
    // Add the last week and day if they exist
    if (currentWeek && Object.keys(currentWeek).length > 0) {
      if (currentDay && Object.keys(currentDay).length > 0) {
        if (!currentWeek.days) currentWeek.days = [];
        currentWeek.days.push(currentDay as MarketingPlanDay);
      }
      weeks.push(currentWeek as MarketingPlanWeek);
    }
    
    // Standardize week titles - just use "Week X" format without themes
    weeks.forEach(week => {
      week.theme = `Week ${week.weekNumber}`;
      
      // Also ensure all week references in activities have consistent naming
      week.days.forEach(day => {
        day.activities.forEach(activity => {
          if (activity.title.includes(`Week ${week.weekNumber}:`)) {
            activity.title = activity.title.replace(`Week ${week.weekNumber}:`, `Week ${week.weekNumber}`);
          }
          if (activity.description.includes(`Week ${week.weekNumber}:`)) {
            activity.description = activity.description.replace(`Week ${week.weekNumber}:`, `Week ${week.weekNumber}`);
          }
        });
      });
    });
    
    // Make sure we have 4 weeks
    while (weeks.length < 4) {
      const weekNumber = weeks.length + 1;
      weeks.push({
        weekNumber,
        theme: `Week ${weekNumber}`,
        goals: [`Implement key marketing strategies for this phase`],
        days: []
      });
    }
    
    return {
      title,
      overview,
      weeks
    };
  } catch (e) {
    console.error('Error parsing marketing plan:', e);
    return generateFallbackMarketingPlan(params);
  }
}

/**
 * Generates a month-long marketing plan using Together AI
 * @param params The marketing plan parameters
 * @returns A structured marketing plan
 */
export async function generateMarketingPlanWithAI(params: MarketingPlanParams): Promise<MarketingPlan> {
  try {
    // Step 1: Extract product attributes to enrich the prompts
    const productAttributes = await extractProductAttributes(params);
    
    // Step 2: Generate the initial plan structure with balanced weeks
    const structurePrompt = constructMarketingPlanPrompt(params, productAttributes);
    
    const structureResponse = await together.chat.completions.create({
      messages: [{"role": "user", "content": structurePrompt}],
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const structureText = structureResponse.choices[0]?.message?.content || '';
    let marketingPlan = parseMarketingPlan(structureText, params);
    
    // Step 3: Now use a separate generation step for each week to ensure quality and completeness
    for (let i = 0; i < marketingPlan.weeks.length; i++) {
      const week = marketingPlan.weeks[i];
      
      // If the week is missing activities or has too few, generate them specifically
      const activityCount = week.days.reduce((sum, day) => sum + day.activities.length, 0);
      if (activityCount < 10) {
        console.log(`Week ${week.weekNumber} has only ${activityCount} activities. Generating detailed content...`);
        
        // Create a targeted prompt to generate just this week's activities
        const weekPrompt = `
You are a marketing expert creating detailed activities for Week ${week.weekNumber}: ${week.theme}.

Marketing Plan: ${marketingPlan.title}
Overall Plan Overview: ${marketingPlan.overview.substring(0, 200)}...
Week Theme: ${week.theme}
Week Goals: ${week.goals.join(', ')}

IMPORTANT REQUIREMENTS:
* Create exactly 10-15 detailed marketing activities for Week ${week.weekNumber}
* Distribute activities across Monday through Friday (2-3 per day)
* Each activity must include:
  - Clear descriptive title
  - Activity type (post, analysis, or task)
  - Detailed description (2-3 sentences minimum)
  - For posts, specify platform: ${params.platforms.join(', ')}
* Focus on quality, practical implementation details
* Maintain a ${params.tone} tone throughout

Format your response as:
MONDAY:
- Activity Title 1 - [Type: post/analysis/task]: Detailed description with actionable information.
- Activity Title 2 - [Type: post/analysis/task]: Detailed description with actionable information.

TUESDAY:
...and so on for all weekdays

Remember to create 10-15 total activities distributed evenly across the 5 weekdays.
`;
        
        const weekResponse = await together.chat.completions.create({
          messages: [{"role": "user", "content": weekPrompt}],
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
          temperature: 0.75,
          max_tokens: 2500
        });
        
        const weekContent = weekResponse.choices[0]?.message?.content || '';
        
        // Parse the generated activities for this specific week
        const updatedWeek = parseWeekActivities(weekContent, params, week.goals, week.theme);
        
        // Replace the days in this week with the newly generated ones, keeping the theme/goals
        if (updatedWeek.days && updatedWeek.days.length > 0) {
          week.days = updatedWeek.days;
        }
      }
    }
    
    // Step 4: Final balancing to ensure proper activity distribution
    marketingPlan = ensureBalancedActivities(marketingPlan);
    
    return marketingPlan;
  } catch (error) {
    console.error('Error generating marketing plan with Together AI:', error);
    return generateFallbackMarketingPlan(params);
  }
}

/**
 * Extract key product attributes to ensure marketing activities are product-specific
 */
async function extractProductAttributes(params: MarketingPlanParams): Promise<Record<string, string[]>> {
  const { productDescription, industry, targetAudience, usp, currentStage } = params;
  
  try {
    // Use AI to extract key product attributes for hyper-specific marketing
    const extractionPrompt = `
PRODUCT ANALYSIS TASK:
Extract specific, actionable product attributes from the following product information. These will be used to create a hyper-personalized marketing plan.

PRODUCT DESCRIPTION:
${productDescription}

INDUSTRY: ${industry.join(', ')}
TARGET AUDIENCE: ${targetAudience.join(', ')}
UNIQUE SELLING PROPOSITION: ${usp}
CURRENT STAGE: ${currentStage}

EXTRACT THE FOLLOWING (be extremely specific to THIS product, not generic):
1. TOP 5 UNIQUE PRODUCT FEATURES (specific functionality, not generic benefits)
2. 3 PRIMARY CUSTOMER PAIN POINTS this product addresses
3. 5 SPECIFIC COMPETITIVE ADVANTAGES (what makes this product better than alternatives)
4. 3 KEY MEASURABLE METRICS for tracking product success
5. 5 CONTENT TOPICS unique to this product (not generic industry topics)
6. Identify 3 SPECIFIC CUSTOMER OBJECTIONS that might prevent purchase
7. 5 UNIQUE PRODUCT USE CASES or scenarios that demonstrate value
8. 3 TECHNICAL SPECIFICATIONS or capabilities worth highlighting
9. PRODUCT ROADMAP concepts for future development (3-5 items)

FORMAT:
Provide each section with detailed, PRODUCT-SPECIFIC bullet points. Each bullet point should be 1-3 sentences describing the exact feature/attribute/aspect in detail.

NO GENERIC MARKETING LANGUAGE. Be extremely concrete and specific to this exact product.`;

    const response = await together.chat.completions.create({
      messages: [{"role": "user", "content": extractionPrompt}],
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      temperature: 1,
    });

    // Parse the attributes from the response
    const attributesText = response.choices[0]?.message?.content || '';
    return parseProductAttributes(attributesText, params);
  } catch (error) {
    console.error('Error extracting product attributes:', error);
    // Return basic attributes to avoid failure
    return {
      features: [usp],
      painPoints: targetAudience.map(a => `${a} needs`),
      competitiveAdvantages: [usp],
      metrics: ['Engagement', 'Conversion', 'Retention'],
      contentTopics: industry.map(i => `${i} insights`),
      objections: ['Price concern', 'Feature gaps', 'Learning curve'],
      useCases: targetAudience.map(a => `${a} using the product`),
      specifications: [currentStage],
      roadmap: ['Future enhancements']
    };
  }
}

/**
 * Parse product attributes from AI-generated text
 */
function parseProductAttributes(text: string, params: MarketingPlanParams): Record<string, string[]> {
  // Default attributes in case parsing fails
  const defaultAttributes = {
    features: [params.usp],
    painPoints: params.targetAudience.map(a => `${a} needs`),
    competitiveAdvantages: [params.usp],
    metrics: ['Engagement', 'Conversion', 'Retention'],
    contentTopics: params.industry.map(i => `${i} insights`),
    objections: ['Price concern', 'Feature gaps', 'Learning curve'],
    useCases: params.targetAudience.map(a => `${a} using the product`),
    specifications: [params.currentStage],
    roadmap: ['Future enhancements']
  };
  
  try {
    // Extract sections from the text
    const featuresMatch = text.match(/TOP 5 UNIQUE PRODUCT FEATURES[\s\S]*?(?=3 PRIMARY CUSTOMER PAIN POINTS|$)/i);
    const painPointsMatch = text.match(/3 PRIMARY CUSTOMER PAIN POINTS[\s\S]*?(?=5 SPECIFIC COMPETITIVE ADVANTAGES|$)/i);
    const advantagesMatch = text.match(/5 SPECIFIC COMPETITIVE ADVANTAGES[\s\S]*?(?=3 KEY MEASURABLE METRICS|$)/i);
    const metricsMatch = text.match(/3 KEY MEASURABLE METRICS[\s\S]*?(?=5 CONTENT TOPICS|$)/i);
    const contentMatch = text.match(/5 CONTENT TOPICS[\s\S]*?(?=3 SPECIFIC CUSTOMER OBJECTIONS|$)/i);
    const objectionsMatch = text.match(/3 SPECIFIC CUSTOMER OBJECTIONS[\s\S]*?(?=5 UNIQUE PRODUCT USE CASES|$)/i);
    const useCasesMatch = text.match(/5 UNIQUE PRODUCT USE CASES[\s\S]*?(?=3 TECHNICAL SPECIFICATIONS|$)/i);
    const specificationsMatch = text.match(/3 TECHNICAL SPECIFICATIONS[\s\S]*?(?=PRODUCT ROADMAP|$)/i);
    const roadmapMatch = text.match(/PRODUCT ROADMAP[\s\S]*?$/i);

    // Extract bullet points from sections
    const extractBulletPoints = (match: RegExpMatchArray | null): string[] => {
      if (!match || !match[0]) return [];
      
      const bulletPattern = /[-•*]\s*(.*?)(?=[-•*]|$)/g;
      const bullets: string[] = [];
      let bulletMatch;
      
      while ((bulletMatch = bulletPattern.exec(match[0])) !== null) {
        if (bulletMatch[1] && bulletMatch[1].trim()) {
          bullets.push(bulletMatch[1].trim());
        }
      }
      
      // If no bullets found, try to extract numbered items
      if (bullets.length === 0) {
        const numberedPattern = /\d+\.\s*(.*?)(?=\d+\.|$)/g;
        while ((bulletMatch = numberedPattern.exec(match[0])) !== null) {
          if (bulletMatch[1] && bulletMatch[1].trim()) {
            bullets.push(bulletMatch[1].trim());
          }
        }
      }
      
      // If still no bullets, just use lines
      if (bullets.length === 0) {
        return match[0].split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.match(/TOP 5|PRIMARY|SPECIFIC|KEY|CONTENT|PRODUCT|TECHNICAL|ROADMAP/i));
      }
      
      return bullets;
    };

    return {
      features: extractBulletPoints(featuresMatch).filter(f => f.length > 0).slice(0, 5),
      painPoints: extractBulletPoints(painPointsMatch).filter(p => p.length > 0).slice(0, 3),
      competitiveAdvantages: extractBulletPoints(advantagesMatch).filter(a => a.length > 0).slice(0, 5),
      metrics: extractBulletPoints(metricsMatch).filter(m => m.length > 0).slice(0, 3),
      contentTopics: extractBulletPoints(contentMatch).filter(c => c.length > 0).slice(0, 5),
      objections: extractBulletPoints(objectionsMatch).filter(o => o.length > 0).slice(0, 3),
      useCases: extractBulletPoints(useCasesMatch).filter(u => u.length > 0).slice(0, 5),
      specifications: extractBulletPoints(specificationsMatch).filter(s => s.length > 0).slice(0, 3),
      roadmap: extractBulletPoints(roadmapMatch).filter(r => r.length > 0).slice(0, 5)
    };
  } catch (error) {
    console.error('Error parsing product attributes:', error);
    return defaultAttributes;
  }
}

/**
 * Constructs a prompt for generating a marketing plan
 */
function constructMarketingPlanPrompt(params: MarketingPlanParams, productAttributes: Record<string, string[]>): string {
  const { productDescription, industry, targetAudience, usp, currentStage } = params;
  
  // Extract key product attributes for the prompt
  const { features, painPoints, competitiveAdvantages, contentTopics,  useCases } = productAttributes;
  
  // Create feature bullets
  const featureBullets = features.map((feature: string, index: number) => `   - Feature ${index + 1}: ${feature}`).join('\n');
  
  // Create pain point bullets
  const painPointBullets = painPoints.map((point: string, index: number) => `   - Pain Point ${index + 1}: ${point}`).join('\n');
  
  // Create advantage bullets
  const advantageBullets = competitiveAdvantages.map((adv: string, index: number) => `   - Advantage ${index + 1}: ${adv}`).join('\n');
  
  // Create content topic bullets
  const contentBullets = contentTopics.map((topic: string, index: number) => `   - Topic ${index + 1}: ${topic}`).join('\n');
  
  // Create use case bullets
  const useCaseBullets = useCases.map((useCase: string, index: number) => `   - Use Case ${index + 1}: ${useCase}`).join('\n');
  
  // Build product info section
  const productInfoSection = `Product: ${productDescription}
Unique Selling Proposition: ${usp}
Current Stage: ${currentStage}
Industry: ${industry.join(', ')}
Target Audience: ${targetAudience.join(', ')}

Key Features:
${featureBullets}

Pain Points Addressed:
${painPointBullets}

Competitive Advantages:
${advantageBullets}

Key Use Cases:
${useCaseBullets}

Content Topics:
${contentBullets}`;
  
  const prompt = `You are an expert marketing strategist creating a 4-week marketing plan.

IMPORTANT CONSTRAINTS:
* Create a BALANCED 4-week marketing plan with 5-15 activities per week (not per day)
* Each week MUST have activities - do not leave any week empty
* The total across all 4 weeks should be around 40-50 activities
* Week 1 should have 10-15 activities (not 100)
* Week 2 should have 10-15 activities 
* Week 3 should have 10-15 activities
* Week 4 should have 10-15 activities
* Each activity must include a detailed description
* Focus on quality over quantity

Product Information:
${productInfoSection}

Marketing Plan Structure:
1. Create a title and brief overview for the marketing plan
2. Divide the plan into 4 weeks, each with a specific theme
3. For each week:
   - Provide 3-5 specific goals
   - Create 10-15 activities spread across Monday to Friday
   - Distribute activities evenly across the days
4. Each activity must include:
   - A clear title
   - Activity type: post, analysis, or task
   - A detailed description (2-3 sentences minimum)
   - For posts, specify the platform: ${params.platforms.join(', ')}

Maintain a ${params.tone} tone throughout.

IMPORTANT REMINDER: Ensure every week has 10-15 activities and NEVER leave any week empty.`;

  return prompt;
}

// function renamed with leading underscore to indicate it's intentionally unused
async function __generateActivitiesWithAI(params: MarketingPlanParams, partialPlan: MarketingPlan): Promise<MarketingPlan> {
  try {
    // Process one week at a time to ensure we have enough token budget for all weeks
    for (let weekIndex = 0; weekIndex < partialPlan.weeks.length; weekIndex++) {
      const week = partialPlan.weeks[weekIndex];
      
      // Ensure we have goals
      if (!week.goals || week.goals.length === 0) {
        week.goals = [`Implement key marketing strategies for Week ${week.weekNumber}`];
      }
      
      // Generate detailed activities for this week
      const weekPrompt = `
You are an expert marketing strategist detailing activities for Week ${week.weekNumber}: ${week.theme} of a marketing plan.

Product: ${params.productDescription}
USP: ${params.usp}
Tone: ${params.tone}
Platforms: ${params.platforms.join(', ')}

IMPORTANT REQUIREMENTS:
* Generate DETAILED content for each activity (2-3 sentences minimum per activity)
* Each activity needs specific, actionable details
* Balance quality with quantity
* Activities should align with the week's theme: "${week.theme}"
* Week Goals: ${week.goals.join(', ')}

For each day (Monday through Friday), create 1-3 activities with:
1. Descriptive title
2. Type (post, analysis, or task)
3. Detailed description (2-3 sentences minimum)
4. Platform specification for posts (choose from: ${params.platforms.join(', ')})

Format each day as:
DAY NAME:
- Activity 1 title - Type: Detailed multi-sentence description focusing on specifics and actionable steps.
- Activity 2 title - Type: Detailed multi-sentence description focusing on specifics and actionable steps.
...and so on
`;

      // Generate detailed activities for this week
      const response = await together.chat.completions.create({
        messages: [{"role": "user", "content": weekPrompt}],
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        temperature: 0.7,
        max_tokens: 2000
      });
      
      const weekActivities = response.choices[0]?.message?.content || '';
      
      // Parse the generated activities for this week
      const parsedActivities = parseWeekActivities(weekActivities, params, week.goals, week.theme);
      
      // Update the week with detailed activities
      if (parsedActivities.days && parsedActivities.days.length > 0) {
        week.days = parsedActivities.days;
      }
    }
    
    return partialPlan;
  } catch (error) {
    console.error('Error generating detailed activities:', error);
    return partialPlan;
  }
}

// New function to parse activities for a single week
function parseWeekActivities(text: string, params: MarketingPlanParams, __goals: string[] = [], theme: string = ''): { days: MarketingPlanDay[] } {
  const days: MarketingPlanDay[] = [];
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  // Find day sections in the text
  dayNames.forEach(dayName => {
    const dayRegex = new RegExp(`${dayName}:?\\s*`, 'i');
    const match = text.match(dayRegex);
    
    if (match) {
      const dayStartIndex = match.index! + match[0].length;
      
      // Find the end of this day's content (next day or end of text)
      let dayEndIndex = text.length;
      for (const nextDay of dayNames) {
        if (nextDay === dayName) continue;
        
        const nextDayRegex = new RegExp(`${nextDay}:?\\s*`, 'i');
        const nextMatch = text.substring(dayStartIndex).match(nextDayRegex);
        
        if (nextMatch && nextMatch.index) {
          const possibleEndIndex = dayStartIndex + nextMatch.index;
          if (possibleEndIndex < dayEndIndex) {
            dayEndIndex = possibleEndIndex;
          }
        }
      }
      
      // Extract day content
      const dayContent = text.substring(dayStartIndex, dayEndIndex).trim();
      
      // Extract activities from bullet points or numbered lists
      const activities: Array<{title: string, description: string, type: 'post' | 'task' | 'analysis', platform?: string}> = [];
      
      // Match activity items with - or * bullet points or numbers
      const activityRegex = /(?:[-*•]|\d+\.)\s+(.+?)(?=\n(?:[-*•]|\d+\.)|$)/gm;
      let activityMatch;
      
      while ((activityMatch = activityRegex.exec(dayContent)) !== null) {
        const activityText = activityMatch[1]?.trim();
        if (!activityText) continue;
        
        // Try to extract title, type and description
        // Patterns like "Title - [Type: type]: Description" or "Title - Type: Description"
        const titleTypeRegex = /^(.*?)(?:\s*[-–]\s*\[Type:\s*(post|task|analysis)\]|\s*[-–]\s*(post|task|analysis)):\s*(.+)$/i;
        const titleTypeMatch = activityText.match(titleTypeRegex);
        
        let title = '', type: 'post' | 'task' | 'analysis' = 'task', description = '';
        
        if (titleTypeMatch) {
          title = titleTypeMatch[1].trim();
          type = (titleTypeMatch[2] || titleTypeMatch[3]).toLowerCase() as 'post' | 'task' | 'analysis';
          description = titleTypeMatch[4].trim();
        } else {
          // Try simpler format: "Title: Description"
          const simpleTitleRegex = /^(.*?):\s*(.+)$/;
          const simpleTitleMatch = activityText.match(simpleTitleRegex);
          
          if (simpleTitleMatch) {
            title = simpleTitleMatch[1].trim();
            description = simpleTitleMatch[2].trim();
            
            // Try to guess type from title
            if (title.toLowerCase().includes('post') || title.toLowerCase().includes('content')) {
              type = 'post';
            } else if (title.toLowerCase().includes('analysis') || title.toLowerCase().includes('report')) {
              type = 'analysis';
            } else {
              type = 'task';
            }
          } else {
            // Just use the whole text as both title and description
            const words = activityText.split(' ');
            if (words.length > 5) {
              title = words.slice(0, 5).join(' ');
              description = activityText;
            } else {
              title = activityText;
              description = `Implement ${activityText} with the team, focusing on ${theme.toLowerCase()} goals.`;
            }
          }
        }
        
        let platform: string | undefined = undefined;
        
        // Detect platform for post activities
        if (type === 'post') {
          for (const p of params.platforms) {
            if (title.toLowerCase().includes(p.toLowerCase()) || description.toLowerCase().includes(p.toLowerCase())) {
              platform = p;
              break;
            }
          }
          
          // Assign a default platform if none detected
          if (!platform && params.platforms.length > 0) {
            platform = params.platforms[0];
          }
        }
        
        activities.push({
          title,
          description,
          type,
          ...(platform ? { platform } : {})
        });
      }
      
      // Create at least one activity if none were detected
      if (activities.length === 0) {
        activities.push({
          title: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${theme} Activity`,
          description: `Implement key marketing activities for ${theme.toLowerCase()}. Review progress with the team and adjust strategy based on feedback.`,
          type: 'task'
        });
      }
      
      days.push({
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        activities
      });
    }
  });
  
  // Ensure we have activities for all weekdays
  dayNames.forEach(dayName => {
    if (!days.find(d => d.dayName.toLowerCase() === dayName)) {
      days.push({
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        activities: [
          {
            title: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} Implementation`,
            description: `Review and implement key strategies for ${theme.toLowerCase()}. Track performance metrics and prepare report for team review.`,
            type: 'task'
          }
        ]
      });
    }
  });
  
  // Sort days in proper order
  days.sort((a, b) => {
    const dayOrder = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5 };
    return dayOrder[a.dayName.toLowerCase() as keyof typeof dayOrder] - 
           dayOrder[b.dayName.toLowerCase() as keyof typeof dayOrder];
  });
  
  return { days };
}

/**
 * Generates a fallback marketing plan when AI generation fails
 */
function generateFallbackMarketingPlan(params: MarketingPlanParams): MarketingPlan {
  const { platforms, productDescription, industry, targetAudience } = params;
  
  // Create a basic marketing plan with some default content
  const platform = platforms[0] || 'social media';
  const audienceDesc = targetAudience[0] || 'target audience';
  const industryDesc = industry[0] || 'your industry';
  
  // Generate a simple 4-week plan
  return {
    title: '4-Week Marketing Plan',
    overview: `This marketing plan is designed to help you promote ${productDescription.substring(0, 50)}... to ${audienceDesc} in the ${industryDesc} space.`,
    weeks: Array.from({ length: 4 }).map((_, i) => ({
      weekNumber: i + 1,
      theme: `Week ${i + 1}`,
      goals: [
        `Increase visibility on ${platform}`,
        `Connect with ${audienceDesc}`,
        `Generate interest in your product`
      ],
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
        dayName: day,
        activities: [
          {
            title: `${platform} Post`,
            description: `Share key benefits of your product for ${audienceDesc}.`,
            platform,
            type: 'post'
          },
          {
            title: 'Audience Research',
            description: `Analyze how ${audienceDesc} is responding to your content.`,
            type: 'analysis'
          }
        ]
      }))
    }))
  };
}

// Function to ensure balanced activities across all four weeks
function ensureBalancedActivities(plan: MarketingPlan): MarketingPlan {
  // Get available platforms from the first week if possible
  const availablePlatforms = plan.weeks.length > 0 && 
                            plan.weeks[0].days.length > 0 && 
                            plan.weeks[0].days[0].activities.length > 0 && 
                            plan.weeks[0].days[0].activities[0].platform ? 
                            [plan.weeks[0].days[0].activities[0].platform] : 
                            ['twitter']; // Default fallback

  // Ensure all weeks have consistent titles
  plan.weeks.forEach(week => {
    week.theme = `Week ${week.weekNumber}`;
  });

  // Count activities per week
  const weekCounts = plan.weeks.map(week => {
    return {
      weekNumber: week.weekNumber,
      count: week.days.reduce((total, day) => total + day.activities.length, 0)
    };
  });
  
  console.log("Activities per week before balancing:", weekCounts);
  
  // Enforce minimum activities per week
  plan.weeks.forEach(week => {
    const activityCount = week.days.reduce((total, day) => total + day.activities.length, 0);
    
    // If a week has zero or very few activities (less than 5)
    if (activityCount < 5) {
      console.log(`Week ${week.weekNumber} has only ${activityCount} activities. Adding more...`);
      
      // Add simple activities to each day until we reach at least 5
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      let addedCount = 0;
      const neededActivities = Math.max(5 - activityCount, 0);
      
      // First ensure we have all days
      dayNames.forEach(dayName => {
        if (!week.days.some(d => d.dayName.toLowerCase() === dayName.toLowerCase())) {
          week.days.push({
            dayName,
            activities: []
          });
        }
      });
      
      // Sort days in proper order
      week.days.sort((a, b) => {
        const dayOrder = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5 };
        return dayOrder[a.dayName.toLowerCase() as keyof typeof dayOrder] - 
               dayOrder[b.dayName.toLowerCase() as keyof typeof dayOrder];
      });
      
      // Add activities until we reach the minimum
      while (addedCount < neededActivities) {
        // Find the day with the fewest activities
        const dayWithFewest = [...week.days].sort((a, b) => 
          a.activities.length - b.activities.length
        )[0];
        
        // Add appropriate activities based on day
        if (dayWithFewest.dayName === 'Monday') {
          dayWithFewest.activities.push({
            title: `Week ${week.weekNumber} Planning Session`,
            description: `Kick off the week with a planning session focused on key goals. Set objectives, assign responsibilities, and establish metrics for success.`,
            type: 'task'
          });
        } else if (dayWithFewest.dayName === 'Friday') {
          dayWithFewest.activities.push({
            title: `Weekly Performance Analysis`,
            description: `Review all marketing metrics and performance indicators. Prepare a report highlighting wins, challenges, and opportunities for next week.`,
            type: 'analysis'
          });
        } else {
          // Random platform selection for post activities
          const randomPlatformIndex = Math.floor(Math.random() * availablePlatforms.length);
          const platform = availablePlatforms[randomPlatformIndex];
          
          dayWithFewest.activities.push({
            title: `Content Creation`,
            description: `Create engaging content for Week ${week.weekNumber}. Focus on addressing customer pain points and showcasing solutions.`,
            type: 'post',
            platform
          });
        }
        
        addedCount++;
      }
    }
    
    // If a week has too many activities (more than 20)
    if (activityCount > 20) {
      console.log(`Week ${week.weekNumber} has ${activityCount} activities. Reducing...`);
      
      // Reduce activities per day to a maximum
      week.days.forEach(day => {
        if (day.activities.length > 4) {
          day.activities = day.activities.slice(0, 4);
        }
      });
    }
  });
  
  // Count activities after balancing
  const updatedCounts = plan.weeks.map(week => {
    return {
      weekNumber: week.weekNumber,
      count: week.days.reduce((total, day) => total + day.activities.length, 0)
    };
  });
  
  console.log("Activities per week after balancing:", updatedCounts);
  
  return plan;
}