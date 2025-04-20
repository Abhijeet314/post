import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerateIdeasParams {
  tone: string;
  numberOfIdeas: number;
  platform: string;
  productDescription: string;
  platformData?: any;
  topExamples?: string[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateIdeasWithAI({
  tone,
  numberOfIdeas,
  platform,
  productDescription,
  platformData,
  topExamples = []
}: GenerateIdeasParams) {
  try {
    // Get Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });

    // Construct the prompt
    const prompt = constructPrompt({
      tone,
      numberOfIdeas,
      platform,
      productDescription,
      platformData,
      topExamples
    });

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Parse ideas from the generated text
    const ideas = parseGeneratedIdeas(generatedText, numberOfIdeas);

    return ideas.map(content => ({
      id: generateId(),
      content,
      platform
    }));

  } catch (error) {
    console.error('Error generating ideas with Gemini:', error);
    return generateFallbackIdeas({
      tone,
      numberOfIdeas,
      platform,
      productDescription
    });
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
  let prompt = `You are an expert in ${platform} marketing content creation.
Task: Generate ${numberOfIdeas} unique, engaging marketing content ideas.

PRODUCT INFORMATION:
${productDescription}

TONE: ${tone}
${getToneGuidelines(tone)}

PLATFORM: ${platform}
${getPlatformGuidelines(platform)}`;

  if (platformData) {
    prompt += `

PLATFORM ANALYTICS:
- Average post length: ${platformData.avgPostLength} characters
- Most effective content types: ${Object.entries(platformData.contentTypes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type]) => type)
      .join(', ')}
- Best performing patterns: ${Object.entries(platformData.marketingPatterns)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([pattern]) => pattern)
      .join(', ')}`;
  }

if ((topExamples?.length ?? 0) > 0) {
  prompt += `

HIGH-PERFORMING EXAMPLES:
${(topExamples || []).map((example, index) => `${index + 1}. "${example}"`).join('\n')}`;
}

  prompt += `

REQUIREMENTS:
1. Generate exactly ${numberOfIdeas} unique ideas
2. Each idea should be platform-optimized
3. Follow the specified tone consistently
4. Include appropriate calls-to-action
5. Format each idea with a number (1., 2., etc.)

Generate the ${numberOfIdeas} ideas now:`;

  return prompt;
}

function parseGeneratedIdeas(text: string, expectedCount: number): string[] {
  const regex = /(?:\d+[\.\)]\s*)([^0-9]+?)(?=\d+[\.\)]\s*|$)/g;
  const matches = [...text.matchAll(regex)];
  
  if (matches.length > 0) {
    return matches
      .map(match => match[1].trim())
      .filter(idea => idea.length > 0)
      .slice(0, expectedCount);
  }
  
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