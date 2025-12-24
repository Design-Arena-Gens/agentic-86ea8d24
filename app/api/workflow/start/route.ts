import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/workflow/scheduler';

// Store active executions in memory (use Redis/DB in production)
const executions = new Map();

export async function POST(request: NextRequest) {
  try {
    const scheduler = getScheduler();

    // Start workflow in background
    const executionPromise = scheduler.executeManual();

    // Store execution promise
    const executionId = `exec_${Date.now()}`;
    executions.set(executionId, {
      promise: executionPromise,
      status: 'running',
      startTime: new Date(),
    });

    // Handle completion
    executionPromise
      .then((result) => {
        executions.set(executionId, {
          status: 'completed',
          result,
          startTime: executions.get(executionId).startTime,
          endTime: new Date(),
        });
      })
      .catch((error) => {
        executions.set(executionId, {
          status: 'failed',
          error: error.message,
          startTime: executions.get(executionId).startTime,
          endTime: new Date(),
        });
      });

    return NextResponse.json({
      id: executionId,
      status: 'running',
      message: 'Workflow started',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
