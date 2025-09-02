
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url, ...options } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url, {
      ...options,
      cache: 'no-store', // Important: bypass Next.js fetch cache
    });
    
    const data = await response.json();

    if (!response.ok) {
       return NextResponse.json({ error: data.error || 'Ollama server returned an error' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
         return NextResponse.json({ error: 'Connection refused. Is Ollama server running?' }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}
