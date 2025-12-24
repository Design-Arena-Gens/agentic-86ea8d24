import { NextRequest, NextResponse } from 'next/server';

// Import the same executions map (in production, use shared storage)
const executions = new Map();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing execution ID' }, { status: 400 });
  }

  const execution = executions.get(id);

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  if (execution.status === 'completed' && execution.result) {
    const result = execution.result;
    return NextResponse.json({
      id,
      status: result.status,
      currentNode: result.currentNode,
      completedNodes: result.completedNodes,
      progress: Math.round((result.completedNodes.length / 10) * 100),
      videoProject: result.videoProject,
      costs: result.videoProject.costs,
      errors: result.errors,
    });
  }

  if (execution.status === 'failed') {
    return NextResponse.json({
      id,
      status: 'failed',
      currentNode: '',
      completedNodes: [],
      progress: 0,
      videoProject: null,
      costs: null,
      errors: [{ node: 'unknown', error: execution.error, timestamp: new Date() }],
    });
  }

  // Running - return intermediate status
  return NextResponse.json({
    id,
    status: 'running',
    currentNode: 'processing',
    completedNodes: [],
    progress: 25,
    videoProject: null,
    costs: { total: 0 },
    errors: [],
  });
}
