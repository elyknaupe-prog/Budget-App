import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Break the extracted text into speakable chunks (roughly one sentence each).
// Short utterances keep speechSynthesis reliable and let us highlight progress.
function splitIntoChunks(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  // Split after sentence-ending punctuation followed by whitespace.
  const rough = cleaned.match(/[^.!?]+[.!?]*\s*/g) || [cleaned];
  const chunks = [];
  const MAX = 240; // further split very long sentences so no utterance is huge
  for (const part of rough) {
    const s = part.trim();
    if (!s) continue;
    if (s.length <= MAX) {
      chunks.push(s);
    } else {
      let buf = '';
      for (const word of s.split(' ')) {
        if ((buf + ' ' + word).trim().length > MAX) {
          if (buf) chunks.push(buf.trim());
          buf = word;
        } else {
          buf = (buf + ' ' + word).trim();
        }
      }
      if (buf) chunks.push(buf.trim());
    }
  }
  return chunks;
}

export default function PdfReader() {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | extracting | ready | error
  const [error, setError] = useState('');
  const [chunks, setChunks] = useState([]);
  const [current, setCurrent] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const chunkRefs = useRef([]);
  const cancelledRef = useRef(false);

  // Load available system voices (they arrive asynchronously in most browsers).
  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) {
        setVoices(list);
        setVoiceURI((prev) => {
          if (prev && list.some((v) => v.voiceURI === prev)) return prev;
          // Prefer a local English voice, then any English, then the first.
          const preferred =
            list.find((v) => v.lang?.startsWith('en') && v.localService) ||
            list.find((v) => v.lang?.startsWith('en')) ||
            list[0];
          return preferred?.voiceURI || '';
        });
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const selectedVoice = useMemo(
    () => voices.find((v) => v.voiceURI === voiceURI) || null,
    [voices, voiceURI]
  );

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (supported) window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrent(-1);
  }, [supported]);

  // Speak from a given chunk index onward, advancing on each utterance's end.
  const speakFrom = useCallback(
    (startIndex) => {
      if (!supported || !chunks.length) return;
      window.speechSynthesis.cancel();
      cancelledRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);

      const speakIndex = (i) => {
        if (cancelledRef.current) return;
        if (i >= chunks.length) {
          setIsPlaying(false);
          setCurrent(-1);
          return;
        }
        setCurrent(i);
        const u = new SpeechSynthesisUtterance(chunks[i]);
        if (selectedVoice) u.voice = selectedVoice;
        u.rate = rate;
        u.pitch = pitch;
        u.onend = () => {
          if (!cancelledRef.current) speakIndex(i + 1);
        };
        u.onerror = (ev) => {
          // 'interrupted'/'canceled' fire on stop; ignore those.
          if (cancelledRef.current || ev.error === 'interrupted' || ev.error === 'canceled') {
            return;
          }
          speakIndex(i + 1);
        };
        window.speechSynthesis.speak(u);
      };

      speakIndex(startIndex);
    },
    [supported, chunks, selectedVoice, rate, pitch]
  );

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    speakFrom(current >= 0 ? current : 0);
  };

  const handlePause = () => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  // Keep current highlight scrolled into view.
  useEffect(() => {
    if (current >= 0 && chunkRefs.current[current]) {
      chunkRefs.current[current].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [current]);

  // Changing voice/rate/pitch mid-playback: restart current chunk with new settings.
  useEffect(() => {
    if (isPlaying && current >= 0) {
      speakFrom(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceURI, rate, pitch]);

  const handleFile = async (file) => {
    if (!file) return;
    stop();
    setError('');
    setChunks([]);
    setCurrent(-1);
    setFileName(file.name);
    setStatus('extracting');
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let full = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items.map((it) => ('str' in it ? it.str : '')).join(' ');
        full += pageText + '\n\n';
      }
      const parsed = splitIntoChunks(full);
      if (!parsed.length) {
        setStatus('error');
        setError(
          'No readable text found. This PDF may be scanned images rather than text.'
        );
        return;
      }
      setChunks(parsed);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'Could not read that PDF.');
    }
  };

  const onInputChange = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') handleFile(file);
    else if (file) setError('Please drop a PDF file.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Reader</h1>
        <p className="text-sm text-slate-500">
          Upload a PDF and have it read aloud in a natural voice.
        </p>
      </div>

      {!supported && (
        <p className="text-sm text-rose-600">
          Your browser doesn&apos;t support speech synthesis. Try Chrome, Edge, or Safari.
        </p>
      )}

      {/* Upload area */}
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="block bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors"
      >
        <input type="file" accept="application/pdf" onChange={onInputChange} className="hidden" />
        <p className="text-sm font-medium text-slate-700">
          {fileName ? `Selected: ${fileName}` : 'Click to choose a PDF, or drag one here'}
        </p>
        <p className="text-xs text-slate-400 mt-1">Everything stays on your device — nothing is uploaded.</p>
      </label>

      {status === 'extracting' && (
        <p className="text-sm text-slate-500">Reading the PDF…</p>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {status === 'ready' && chunks.length > 0 && (
        <>
          {/* Controls */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 text-sm rounded-md bg-amber-500 hover:bg-amber-600 text-white font-medium"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  disabled={!supported}
                  className="px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
                >
                  {isPaused ? 'Resume' : current >= 0 ? 'Play' : 'Play from start'}
                </button>
              )}
              <button
                onClick={stop}
                className="px-4 py-2 text-sm rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
              >
                Stop
              </button>
              <span className="text-xs text-slate-400 ml-2">
                {current >= 0 ? `Sentence ${current + 1} of ${chunks.length}` : `${chunks.length} sentences`}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Voice</span>
                <select
                  value={voiceURI}
                  onChange={(e) => setVoiceURI(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}){v.localService ? '' : ' — online'}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Speed: {rate.toFixed(1)}×</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="mt-2 w-full accent-emerald-600"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Pitch: {pitch.toFixed(1)}</span>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className="mt-2 w-full accent-emerald-600"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Transcript with live highlighting; click any sentence to jump there */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 max-h-[50vh] overflow-y-auto leading-relaxed">
            <p className="text-sm">
              {chunks.map((c, i) => (
                <span
                  key={i}
                  ref={(el) => (chunkRefs.current[i] = el)}
                  onClick={() => speakFrom(i)}
                  className={`cursor-pointer rounded px-0.5 ${
                    i === current
                      ? 'bg-emerald-200 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {c}{' '}
                </span>
              ))}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
