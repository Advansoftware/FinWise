
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return default config for now
    // In a real implementation, this might fetch from database/settings
    return NextResponse.json({
      config: {
        enabled: false,
        // Add other properties if needed based on PushConfig interface
      }
    });

  } catch (error) {
    console.error('Push config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Mock save
    return NextResponse.json({ success: true, config: body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
