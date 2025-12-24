import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/workflow/scheduler';

let schedulerStarted = false;

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    const scheduler = getScheduler();

    if (action === 'start') {
      if (!schedulerStarted) {
        scheduler.start();
        schedulerStarted = true;
      }
      return NextResponse.json({ status: 'started' });
    }

    if (action === 'stop') {
      scheduler.stop();
      schedulerStarted = false;
      return NextResponse.json({ status: 'stopped' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    schedulerStarted,
    schedule: process.env.WORKFLOW_SCHEDULE || '0 6 * * *',
    timezone: process.env.WORKFLOW_TIMEZONE || 'Asia/Kolkata',
  });
}
