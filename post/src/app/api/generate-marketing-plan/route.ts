import { NextResponse } from "next/server";
import { generateMarketingPlanWithAI, MarketingPlanParams } from "@/lib/aiservice";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.tone || !data.platforms || !data.productDescription || 
        !data.industry || !data.targetAudience || !data.usp || !data.currentStage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Generate marketing plan
    const marketingPlan = await generateMarketingPlanWithAI(data as MarketingPlanParams);
    
    return NextResponse.json({ marketingPlan });
  } catch (error) {
    console.error("Error generating marketing plan:", error);
  }
} 