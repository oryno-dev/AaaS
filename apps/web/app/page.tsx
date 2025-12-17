"use client";
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("arcee-ai/trinity-mini:free");
  const [format, setFormat] = useState("mp4");
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const evtRef = useRef<EventSource | null>(null);

  const startJob = async () => {
    setLogs("");
    setVideoUrl(null);
    const fd = new FormData();
    if (!file) { alert('Please upload an image (png/jpg/svg).'); return; }
    fd.append('file', file);
    fd.append('prompt', prompt);
    fd.append('model', model);
    fd.append('format', format);
    const res = await fetch('/api/jobs', { method: 'POST', body: fd });
    if (!res.ok) {
      const t = await res.text();
      alert('Failed to start job: '+t);
      return;
    }
    const json = await res.json();
    setJobId(json.id);
  };

  useEffect(() => {
    if (!jobId) return;
    if (evtRef.current) evtRef.current.close();
    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    evtRef.current = es;
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'log') setLogs((s)=> s + data.line);
        if (data.type === 'done') {
          if (data.ok) {
            setLogs((s)=> s + '\n✅ Job completed successfully!\n');
            setVideoUrl(`/api/jobs/${jobId}/result`);
          } else {
            setLogs((s)=> s + '\n❌ Job failed. Check logs above for errors.\n');
          }
          es.close();
        }
        if (data.type === 'error') {
          setLogs((s)=> s + `\n❌ ERROR: ${data.message}\n`);
        }
      } catch {}
    };
    es.onerror = () => {
      setLogs((s)=> s + "\n[stream closed]\n");
      es.close();
    };
    return () => { es.close(); };
  }, [jobId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="border-r border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Realify: Generate Motion Video</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Input image</label>
          <input className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" value={model} onChange={(e)=> setModel(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Format</label>
          <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" value={format} onChange={(e)=> setFormat(e.target.value)}>
            <option value="mp4">mp4</option>
            <option value="webm">webm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prompt</label>
          <textarea className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" value={prompt} onChange={(e)=> setPrompt(e.target.value)} rows={10} />
        </div>
        <div>
          <button className="inline-flex items-center rounded-md bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-50" onClick={startJob}>Run</button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-semibold">Logs</h3>
        <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 h-60 overflow-auto rounded-md text-sm">{logs}</pre>
        <h3 className="text-xl font-semibold">Preview</h3>
        {videoUrl ? (
          <video src={videoUrl} controls className="w-full max-h-[400px] rounded-md border border-gray-200 dark:border-gray-800" />
        ) : (
          <div className="text-gray-500">No output yet.</div>
        )}
      </div>
    </div>
  );
}
