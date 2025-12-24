'use client';

import { useState, useEffect } from 'react';

interface ExecutionStatus {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  currentNode: string;
  completedNodes: string[];
  progress: number;
  videoProject: any;
  costs: any;
  errors: any[];
}

export default function Home() {
  const [execution, setExecution] = useState<ExecutionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const startWorkflow = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Initializing workflow...');

    try {
      const response = await fetch('/api/workflow/start', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start workflow');
      }

      const data = await response.json();
      addLog(`Workflow started: ${data.id}`);

      // Poll for status
      pollStatus(data.id);
    } catch (error) {
      addLog(`Error: ${error}`);
      setLoading(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/workflow/status?id=${id}`);
        const data = await response.json();

        setExecution(data);
        addLog(`[${data.currentNode}] ${data.status}`);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);

          if (data.status === 'completed') {
            addLog('✅ Workflow completed successfully!');
            addLog(`Video URL: ${data.videoProject.finalVideo.url}`);
            addLog(`Total Cost: $${data.costs.total.toFixed(2)}`);
          } else {
            addLog('❌ Workflow failed');
            data.errors.forEach((err: any) => {
              addLog(`Error in ${err.node}: ${err.error}`);
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
  };

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const nodes = [
    'setup',
    'channel-profile',
    'content-research',
    'script-generation',
    'visual-generation',
    'audio-generation',
    'video-editing',
    'upload-preparation',
    'youtube-upload',
    'completion',
  ];

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1f2937' }}>
          🎬 AI Content Factory
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Automated YouTube Video Creation System
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className="button"
            onClick={startWorkflow}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Start Workflow'}
          </button>

          <button
            className="button button-secondary"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            Reset
          </button>
        </div>

        {execution && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#1f2937' }}>Status</h2>
              <span className={`status-badge status-${execution.status}`}>
                {execution.status.toUpperCase()}
              </span>
            </div>

            <div className="progress-bar" style={{ marginBottom: '2rem' }}>
              <div
                className="progress-fill"
                style={{ width: `${execution.progress}%` }}
              />
            </div>

            <div className="grid">
              <div className="metric">
                <div className="metric-value">{execution.completedNodes.length}</div>
                <div className="metric-label">Completed Nodes</div>
              </div>
              <div className="metric">
                <div className="metric-value">{nodes.length - execution.completedNodes.length}</div>
                <div className="metric-label">Remaining Nodes</div>
              </div>
              <div className="metric">
                <div className="metric-value">
                  ${execution.costs?.total?.toFixed(2) || '0.00'}
                </div>
                <div className="metric-label">Total Cost</div>
              </div>
              <div className="metric">
                <div className="metric-value">
                  {execution.videoProject?.qualityScores?.overall || 0}
                </div>
                <div className="metric-label">Quality Score</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {execution && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>
            Workflow Progress
          </h2>
          <div className="node-list">
            {nodes.map((node) => {
              const isCompleted = execution.completedNodes.includes(node);
              const isCurrent = execution.currentNode === node;
              const status = isCompleted ? 'completed' : isCurrent ? 'running' : 'pending';

              return (
                <div key={node} className="node-item">
                  <div className={`node-icon ${status}`}>
                    {isCompleted ? '✓' : isCurrent ? '⟳' : '○'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>
                      {node.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </div>
                    {isCurrent && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            Execution Logs
          </h2>
          <div className="log-container">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {execution?.videoProject?.finalVideo?.url && execution.status === 'completed' && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            ✅ Video Created Successfully!
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Title:</strong> {execution.videoProject.metadata.title}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>URL:</strong>{' '}
            <a
              href={execution.videoProject.finalVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea' }}
            >
              {execution.videoProject.finalVideo.url}
            </a>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Duration:</strong> {Math.floor(execution.videoProject.finalVideo.duration / 60)}m{' '}
            {execution.videoProject.finalVideo.duration % 60}s
          </div>
          <div className="grid">
            <div className="metric">
              <div className="metric-value">{execution.videoProject.qualityScores.script}</div>
              <div className="metric-label">Script Quality</div>
            </div>
            <div className="metric">
              <div className="metric-value">{execution.videoProject.qualityScores.visual}</div>
              <div className="metric-label">Visual Quality</div>
            </div>
            <div className="metric">
              <div className="metric-value">{execution.videoProject.qualityScores.audio}</div>
              <div className="metric-label">Audio Quality</div>
            </div>
            <div className="metric">
              <div className="metric-value">{execution.videoProject.qualityScores.overall}</div>
              <div className="metric-label">Overall Quality</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ background: '#f9fafb' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1f2937' }}>
          System Information
        </h3>
        <div style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.8' }}>
          <p><strong>Total Nodes:</strong> 65 (10 major sections shown)</p>
          <p><strong>Automation Level:</strong> 95%</p>
          <p><strong>Expected Duration:</strong> 25-35 minutes</p>
          <p><strong>Budget per Video:</strong> $4-6</p>
          <p><strong>Quality Threshold:</strong> 88/100</p>
        </div>
      </div>
    </div>
  );
}
