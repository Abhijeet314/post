import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Content from '@/models/Content';

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    const content = await Content.create(data);
    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error('Error saving content:', error);
    return NextResponse.json(
      { message: 'Error saving content' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const contents = await Content.find().sort({ createdAt: -1 });
    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { message: 'Error fetching content' },
      { status: 500 }
    );
  }
}