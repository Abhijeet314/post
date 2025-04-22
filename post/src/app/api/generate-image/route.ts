import { NextResponse } from "next/server";
import { generateImageWithAI } from "@/lib/aiservice";

export async function POST(req: Request) {
  try {
    const { content, platform } = await req.json();
    
    if (!content || !platform) {
      return NextResponse.json(
        { error: "Content and platform are required" },
        { status: 400 }
      );
    }
    
    const imageUrl = await generateImageWithAI(content, platform);
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error);
  }
} 