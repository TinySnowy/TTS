"use client";

import { useState, useEffect, useRef } from "react";

interface Voice {
  id: string;
  name: string;
  lang: string;
  gender: string;
}

export default function Home() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("zh");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [emotion, setEmotion] = useState<string>("neutral");
  const [emotionIntensity, setEmotionIntensity] = useState<number>(4.0);
  const [loudness, setLoudness] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // Fetch voices
    fetch("/api/get_voices")
      .then((res) => res.json())
      .then((data) => {
        setVoices(data.voices);
        // Set default voice
        const zhVoice = data.voices.find((v: Voice) => v.lang === "zh");
        if (zhVoice) setSelectedVoice(zhVoice.id);
      })
      .catch((err) => console.error("Failed to fetch voices:", err));
  }, []);

  const filteredVoices = voices.filter((v) => v.lang === selectedLang);
  const emotionVoices = filteredVoices.filter(v => v.name.includes('Emotion'));
  const standardVoices = filteredVoices.filter(v => !v.name.includes('Emotion'));

  const currentVoice = voices.find(v => v.id === selectedVoice);
  const isEmotionSupported = currentVoice ? currentVoice.name.includes('Emotion') : false;

  // Re-implementing with MediaSource Extensions (MSE) for robust streaming
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || isNaN(time)) return "--:--";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
        setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', () => setIsPlaying(false));
            audio.removeEventListener('play', () => setIsPlaying(true));
            audio.removeEventListener('pause', () => setIsPlaying(false));
        };
    }
  }, []);

  const handleGenerateMSE = async () => {
    if (!text || !selectedVoice) return;
    setIsLoading(true);
    setIsPlaying(true);

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    
    if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(mediaSource);
        audioRef.current.play().catch(e => console.log("Play error", e));
    }

    mediaSource.addEventListener('sourceopen', async () => {
        try {
            const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
            sourceBufferRef.current = sourceBuffer;
            
            sourceBuffer.addEventListener('updateend', () => {
                if (queueRef.current.length > 0 && !sourceBuffer.updating) {
                    const nextChunk = queueRef.current.shift();
                    if (nextChunk) sourceBuffer.appendBuffer(nextChunk as any);
                }
            });

            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text,
                  voice_id: selectedVoice,
                  speed,
                  pitch,
                  loudness,
                  emotion,
                  emotion_intensity: emotionIntensity,
                  language: selectedLang,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error:", response.status, errorText);
                alert(`TTS Error (${response.status}): ${errorText}`);
                setIsLoading(false);
                setIsPlaying(false);
                return;
            }

            if (!response.body) return;
            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (mediaSource.readyState === 'open') {
                        // Wait for queue to empty before ending
                         const checkEnd = setInterval(() => {
                            if (!sourceBuffer.updating && queueRef.current.length === 0) {
                                if (mediaSource.readyState === 'open') mediaSource.endOfStream();
                                clearInterval(checkEnd);
                                setIsLoading(false);
                            }
                        }, 100);
                    }
                    break;
                }

                if (sourceBuffer.updating || queueRef.current.length > 0) {
                    queueRef.current.push(value);
                } else {
                    sourceBuffer.appendBuffer(value);
                }
            }
        } catch (e) {
            console.error("MSE Error:", e);
            setIsLoading(false);
        }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 gap-8 bg-slate-950 text-slate-100 font-sans">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      
      <div className="z-10 text-center space-y-2">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent pb-2">
          BytePlus TTS
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Experience next-generation speech synthesis with 17+ pre-trained voices across 4 languages.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl z-10">
        {/* Controls */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 shadow-2xl p-8 rounded-2xl ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Configuration
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Language</label>
                  <div className="relative">
                    <select 
                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
                        value={selectedLang}
                        onChange={(e) => {
                            setSelectedLang(e.target.value);
                            const firstVoice = voices.find(v => v.lang === e.target.value);
                            if (firstVoice) setSelectedVoice(firstVoice.id);
                        }}
                    >
                        <option value="zh">Chinese ({voices.filter(v => v.lang === 'zh').length})</option>
                        <option value="en">English ({voices.filter(v => v.lang === 'en').length})</option>
                        <option value="ja">Japanese ({voices.filter(v => v.lang === 'ja').length})</option>
                        <option value="es">Spanish ({voices.filter(v => v.lang === 'es').length})</option>
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Voice Persona</label>
                  <div className="relative">
                    <select 
                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                    >
                        {emotionVoices.length > 0 && (
                            <optgroup label="Emotion Capable Voices">
                                {emotionVoices.map((voice) => (
                                    <option key={voice.id} value={voice.id}>
                                        {voice.name}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                        {standardVoices.length > 0 && (
                            <optgroup label="Standard Voices">
                                {standardVoices.map((voice) => (
                                    <option key={voice.id} value={voice.id}>
                                        {voice.name}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                     <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-400">Speed</label>
                    <span className="text-sm text-indigo-400 font-mono">{speed}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-400">Pitch</label>
                    <span className="text-sm text-indigo-400 font-mono">{pitch}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-400">Loudness</label>
                    <span className="text-sm text-indigo-400 font-mono">{loudness}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={loudness}
                    onChange={(e) => setLoudness(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`text-sm font-medium ${isEmotionSupported ? 'text-slate-400' : 'text-slate-600'}`}>Emotion</label>
                    {!isEmotionSupported && <span className="text-xs text-amber-500/80 font-mono">Not supported for this voice</span>}
                  </div>
                  <div className="relative">
                    <select 
                        disabled={!isEmotionSupported}
                        className={`w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all ${!isEmotionSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={emotion}
                        onChange={(e) => setEmotion(e.target.value)}
                    >
                        <option value="neutral">Neutral</option>
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="angry">Angry</option>
                        <option value="scared">Fear</option>
                        <option value="disgust">Disgust</option>
                        <option value="surprise">Surprise</option>
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                  </div>
                </div>

                {emotion !== 'neutral' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-400">Emotion Intensity</label>
                    <span className="text-sm text-indigo-400 font-mono">{emotionIntensity}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="5.0" 
                    step="0.1" 
                    value={emotionIntensity}
                    onChange={(e) => setEmotionIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Input Text</label>
              <textarea 
                className="w-full p-4 border border-slate-700 rounded-xl h-40 bg-slate-800 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all" 
                placeholder="Type something to convert to speech..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              ></textarea>
            </div>
            
            <button 
                onClick={handleGenerateMSE}
                disabled={isLoading || !text}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] ${
                    isLoading || !text 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-900/20'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Synthesizing...
                </span>
              ) : 'Generate Speech'}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 shadow-2xl p-8 rounded-2xl ring-1 ring-white/5 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            Audio Output
          </h2>
          <div className="flex-grow flex flex-col items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800 p-8 relative overflow-hidden group">
            
            {/* Visualizer Background Effect */}
            {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-2 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s`, animationDuration: '0.8s' }}></div>
                    ))}
                </div>
            )}

            <div className="w-full max-w-sm space-y-8 text-center relative z-10">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-500 ${
                    isPlaying 
                    ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/50 scale-110' 
                    : 'bg-slate-800 text-slate-600 ring-1 ring-slate-700'
                }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-12 h-12 ${isPlaying ? 'animate-pulse' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                </div>
                
                <div className="space-y-2">
                    <p className={`text-lg font-medium transition-colors ${isPlaying ? 'text-indigo-300' : 'text-slate-500'}`}>
                        {isPlaying ? 'Streaming Audio...' : 'Ready to Generate'}
                    </p>
                    <p className="text-xs text-slate-600">
                        {isPlaying ? 'Receiving chunks from BytePlus API' : 'Enter text and click generate to start'}
                    </p>
                </div>

                <audio 
                    ref={audioRef} 
                    className="hidden" 
                />

                {/* Custom Audio Player UI */}
                <div className="w-full bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm border border-slate-700/50 flex items-center gap-4 transition-all hover:bg-slate-800/80">
                    <button 
                        onClick={handlePlayPause}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-900/30 flex-shrink-0"
                    >
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 translate-x-0.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                        )}
                    </button>
                    
                    <div className="flex-grow flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={Number.isFinite(duration) ? duration : 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                            style={{
                                background: `linear-gradient(to right, #6366f1 ${(currentTime / (Number.isFinite(duration) && duration > 0 ? duration : 100)) * 100}%, #334155 ${(currentTime / (Number.isFinite(duration) && duration > 0 ? duration : 100)) * 100}%)`
                            }}
                        />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}