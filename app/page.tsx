'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  const runAudit = async () => {
    if (!url) return;
    
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error('Audit failed');
      
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Telehealth Marketing Audit
          </h1>
          <p className="text-slate-400 text-lg">
            Paste any telehealth website URL. Get instant marketing intelligence.
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-4 mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example-telehealth.com"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-blue-500 focus:outline-none text-white placeholder-slate-400"
          />
          <button
            onClick={runAudit}
            disabled={loading || !url}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Analyzing...' : 'Run Audit'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Scraping site and analyzing...</p>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-8">
            {/* Overview */}
            <section className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                📊 Overview
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <ScoreCard label="Marketing Score" score={report.scores?.marketing} />
                <ScoreCard label="Compliance Score" score={report.scores?.compliance} />
                <ScoreCard label="AI Visibility" score={report.scores?.aiVisibility} />
              </div>
            </section>

            {/* Marketing Teardown */}
            <section className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">🎯 Marketing Teardown</h2>
              <div className="space-y-4 text-slate-300">
                <div>
                  <h3 className="font-medium text-white">Messaging</h3>
                  <p>{report.marketing?.messaging || 'Not analyzed'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-white">Trust Signals</h3>
                  <ul className="list-disc list-inside">
                    {report.marketing?.trustSignals?.map((signal: string, i: number) => (
                      <li key={i}>{signal}</li>
                    )) || <li>None detected</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-white">CTAs Found</h3>
                  <ul className="list-disc list-inside">
                    {report.marketing?.ctas?.map((cta: string, i: number) => (
                      <li key={i}>{cta}</li>
                    )) || <li>None detected</li>}
                  </ul>
                </div>
              </div>
            </section>

            {/* Compliance Check */}
            <section className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">⚠️ Compliance Check</h2>
              <div className="space-y-3">
                {report.compliance?.flags?.map((flag: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      flag.severity === 'high'
                        ? 'bg-red-900/30 border border-red-700'
                        : flag.severity === 'medium'
                        ? 'bg-yellow-900/30 border border-yellow-700'
                        : 'bg-green-900/30 border border-green-700'
                    }`}
                  >
                    <span className="font-medium">{flag.issue}</span>
                    <p className="text-sm text-slate-400 mt-1">{flag.details}</p>
                  </div>
                )) || <p className="text-slate-400">No compliance issues detected</p>}
              </div>
            </section>

            {/* Competitive Intel */}
            <section className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">🔍 Competitive Intel</h2>
              <div className="grid grid-cols-2 gap-4 text-slate-300">
                <div>
                  <h3 className="font-medium text-white">Services</h3>
                  <ul className="list-disc list-inside">
                    {report.competitive?.services?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    )) || <li>Not detected</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-white">Tech Stack</h3>
                  <ul className="list-disc list-inside">
                    {report.competitive?.techStack?.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    )) || <li>Not detected</li>}
                  </ul>
                </div>
              </div>
            </section>

            {/* Recommendations */}
            <section className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">💡 Recommendations</h2>
              <ul className="space-y-2">
                {report.recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400">→</span>
                    <span className="text-slate-300">{rec}</span>
                  </li>
                )) || <li className="text-slate-400">No recommendations</li>}
              </ul>
            </section>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                Download PDF
              </button>
              <button className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">
                Share Report
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreCard({ label, score }: { label: string; score?: number }) {
  const s = score ?? 0;
  const color = s >= 70 ? 'text-green-400' : s >= 40 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className="bg-slate-700 rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{s}/100</div>
      <div className="text-slate-400 text-sm mt-1">{label}</div>
    </div>
  );
}
