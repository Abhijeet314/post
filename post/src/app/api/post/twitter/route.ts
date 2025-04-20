import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { text } = await req.json()

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
  } catch (error: any) {
    console.error('Tweet posting error:', error)
    return NextResponse.json(
      { error: error.message || "Failed to post tweet" },
      { status: 500 }
    )
  }
}