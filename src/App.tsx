/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Video, 
  Zap, 
  Image as ImageIcon, 
  Music, 
  DollarSign, 
  History, 
  Plus, 
  LogOut, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Copy,
  Check,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

import { auth, db, googleProvider } from './firebase';
import { generateViralScript } from './services/gemini';
import { ViralScript, UserProfile, MusicTrack } from './types';
import { cn } from './lib/utils';
import { AdBanner } from './components/AdBanner';
import { MUSIC_LIBRARY } from './constants';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentScript, setCurrentScript] = useState<ViralScript | null>(null);
  const [history, setHistory] = useState<ViralScript[]>([]);
  const [activeTab, setActiveTab] = useState<'script' | 'visuals' | 'audio' | 'monetization'>('script');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const togglePreview = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      audioElement?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const newAudio = new Audio(track.url);
      newAudio.play();
      newAudio.onended = () => setPlayingTrackId(null);
      setAudioElement(newAudio);
      setPlayingTrackId(track.id);
    }
  };

  const selectMusic = async (track: MusicTrack) => {
    if (!currentScript?.id) return;
    try {
      const scriptRef = doc(db, 'scripts', currentScript.id);
      await setDoc(scriptRef, { selectedMusic: track }, { merge: true });
      setCurrentScript({ ...currentScript, selectedMusic: track });
    } catch (err) {
      console.error("Error selecting music:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        // Save user profile
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'scripts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const scripts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ViralScript[];
        setHistory(scripts);
      }, (err) => {
        console.error("Firestore error:", err);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to login. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentScript(null);
    setHistory([]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !user) return;

    setIsGenerating(true);
    setError(null);
    try {
      const script = await generateViralScript(topic, user.uid);
      await addDoc(collection(db, 'scripts'), script);
      setCurrentScript(script);
      setTopic('');
    } catch (err) {
      console.error("Generation error:", err);
      setError("Failed to generate script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scripts', id));
      if (currentScript?.id === id) {
        setCurrentScript(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-full h-full bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800 shadow-2xl">
              <Video className="w-12 h-12 text-white" />
              <div className="absolute bottom-6 right-6 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-3 h-3 text-neutral-900 fill-current ml-0.5" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
            Velo<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">Viral</span>
          </h1>
          <p className="text-neutral-400 mb-8 text-lg">
            Create high-earning, faceless viral videos in Roman Urdu. 
            Expert Pakistani social media trends at your fingertips.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-red-500 rounded-xl blur-md opacity-40 animate-pulse"></div>
              <div className="relative w-full h-full bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 shadow-inner">
                <Zap className="w-6 h-6 text-orange-500 fill-orange-500/20" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl text-white tracking-tighter uppercase italic">Velo<span className="text-orange-500">Viral</span></span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Viral Creator Pro</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 rounded-full border border-neutral-800">
              <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium text-neutral-300 hidden sm:block">{user.displayName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator & History */}
        <div className="lg:col-span-4 space-y-8">
          {/* Generator Form */}
          <section className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Naya Viral Idea
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Video Topic ya Niche</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="E.g. Pakistani cricket history, earning from AI, local food hacks..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white placeholder:text-neutral-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none h-32"
                />
              </div>
              <button 
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Viral Script
                  </>
                )}
              </button>
            </form>
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-neutral-400" />
              Pichlay Scripts
            </h2>
            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setCurrentScript(item)}
                  className={cn(
                    "group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                    currentScript?.id === item.id 
                      ? "bg-orange-500/10 border-orange-500/50" 
                      : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                  )}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-sm font-bold text-white truncate">{item.topic}</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.id) handleDelete(item.id);
                      }}
                      className="p-2 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
                  <p className="text-neutral-500 text-sm">Abhi tak koi script nahi banaya.</p>
                </div>
              )}
            </div>
            {/* AdMob Banner Placeholder */}
            <AdBanner slot={import.meta.env.VITE_ADMOB_BANNER_SLOT || "sidebar-banner"} className="mt-8" />
          </section>
        </div>

        {/* Right Column: Script Display */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {currentScript ? (
              <motion.div 
                key={currentScript.id || 'current'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl"
              >
                {/* Script Header */}
                <div className="p-6 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{currentScript.topic}</h2>
                    <p className="text-neutral-400 text-sm mt-1">Generated on {new Date(currentScript.createdAt).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(currentScript.script)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-800 overflow-x-auto scrollbar-hide">
                  <TabButton 
                    active={activeTab === 'script'} 
                    onClick={() => setActiveTab('script')}
                    icon={<Zap className="w-4 h-4" />}
                    label="Script"
                  />
                  <TabButton 
                    active={activeTab === 'visuals'} 
                    onClick={() => setActiveTab('visuals')}
                    icon={<ImageIcon className="w-4 h-4" />}
                    label="Visuals"
                  />
                  <TabButton 
                    active={activeTab === 'audio'} 
                    onClick={() => setActiveTab('audio')}
                    icon={<Music className="w-4 h-4" />}
                    label="Audio"
                  />
                  <TabButton 
                    active={activeTab === 'monetization'} 
                    onClick={() => setActiveTab('monetization')}
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Earning"
                  />
                </div>

                {/* Content Area */}
                <div className="p-8 min-h-[400px]">
                  {activeTab === 'script' && (
                    <div className="space-y-8">
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Viral Hook (First 3s)</h4>
                        <p className="text-xl font-bold text-white italic">"{currentScript.hook}"</p>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Full Narration (Roman Urdu)</h4>
                        <div className="text-lg leading-relaxed whitespace-pre-wrap text-neutral-200">
                          <ReactMarkdown>{currentScript.script}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'visuals' && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">AI Visual Prompts (Luma/Leonardo)</h4>
                      {currentScript.scenes.map((scene, i) => (
                        <div key={i} className="group p-6 bg-neutral-950 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-orange-500 px-2 py-1 bg-orange-500/10 rounded">SCENE {i + 1}</span>
                            <span className="text-xs text-neutral-500 font-mono">{scene.duration}</span>
                          </div>
                          <p className="text-neutral-300 leading-relaxed">{scene.prompt}</p>
                          <button 
                            onClick={() => copyToClipboard(scene.prompt)}
                            className="mt-4 text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Copy className="w-3 h-3" /> Copy Prompt
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Audio Cues & Tone</h4>
                        <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                              <Music className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="font-bold text-white">Voiceover Instructions</span>
                          </div>
                          <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{currentScript.audioCues}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Background Music Library</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {MUSIC_LIBRARY.map((track) => (
                            <div 
                              key={track.id}
                              className={cn(
                                "p-4 rounded-xl border transition-all flex items-center justify-between group",
                                currentScript.selectedMusic?.id === track.id 
                                  ? "bg-blue-500/10 border-blue-500/50" 
                                  : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => togglePreview(track)}
                                  className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                                >
                                  {playingTrackId === track.id ? (
                                    <Pause className="w-4 h-4 text-white" />
                                  ) : (
                                    <Play className="w-4 h-4 text-white ml-0.5" />
                                  )}
                                </button>
                                <div>
                                  <p className="text-sm font-bold text-white">{track.title}</p>
                                  <p className="text-xs text-neutral-500">{track.genre}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => selectMusic(track)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                  currentScript.selectedMusic?.id === track.id
                                    ? "bg-blue-500 text-white"
                                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                                )}
                              >
                                {currentScript.selectedMusic?.id === track.id ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'monetization' && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">How to Earn (Pakistan Context)</h4>
                      <div className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-green-500 uppercase tracking-widest">Monetization Strategy</span>
                            <span className="text-xl font-bold text-white">PKR Earning Tips</span>
                          </div>
                        </div>
                        <div className="text-neutral-200 leading-relaxed text-lg">
                          <ReactMarkdown>{currentScript.monetizationTip}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-neutral-900/30 rounded-3xl border-2 border-dashed border-neutral-800">
                <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                  <Zap className="w-10 h-10 text-neutral-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Apna Pehla Viral Script Banayein</h3>
                <p className="text-neutral-500 max-w-md">
                  Topic enter karein aur AI aapke liye high-retention script, visuals, aur earning tips generate karega.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-neutral-900 text-center">
        <AdBanner slot={import.meta.env.VITE_ADMOB_BANNER_SLOT || "footer-banner"} className="max-w-2xl mx-auto mb-8" />
        <p className="text-neutral-600 text-sm">
          Built for Pakistani Creators. Powered by Velo Viral AI.
        </p>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap",
        active 
          ? "text-orange-500 border-orange-500 bg-orange-500/5" 
          : "text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
