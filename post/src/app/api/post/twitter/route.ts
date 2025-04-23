import { NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"
import { Session } from "next-auth"

// Extend the Session type to include accessToken
interface TwitterSession extends Session {
  accessToken?: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession() as unknown as TwitterSession
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const requestData = await req.json()
    const { text, image } = requestData

    // If there's an image (as base64 data URL), upload it first
    if (image && image.startsWith('data:image')) {
      try {
        // Use Twitter v2 API to create a tweet with text only (no media support yet in v2)
        // For media uploads, we would need to use v1.1 API with a more complex OAuth 1.0 authentication
        // This is beyond the scope of this implementation
        console.log("Image posting to Twitter requires OAuth 1.0a authentication and v1.1 API");
        console.log("Posting as text-only tweet instead");

        // Fall back to posting just the text
        const response = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
            "X-Client-Type": "oauth2-user",
          },
          body: JSON.stringify({
            "text": text
          })
        });

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Twitter API Error:', errorData)
          return NextResponse.json(
            { error: errorData.detail || "Failed to post tweet" },
            { status: response.status }
          )
        }

        const data = await response.json()
        return NextResponse.json({
          ...data,
          warning: "Image was not included due to API limitations. Posted as text-only tweet."
        })
      } catch (mediaError) {
        console.error('Media handling error:', mediaError)
      }
    } else {
      // Text-only tweet (existing implementation)
      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
          "X-Client-Type": "oauth2-user",
        },
        body: JSON.stringify({
          "text": text
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Twitter API Error:', errorData)
        return NextResponse.json(
          { error: errorData.detail || "Failed to post tweet" },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Tweet posting error:', error)
  }
}