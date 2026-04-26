import { useState, useMemo, useEffect, useRef } from "react";
import {
  Stethoscope,
  MessageSquare,
  Settings,
  Info,
  Search,
  BookOpen,
  ChevronRight,
  Smile,
  AlertCircle,
  FileText,
  Clock,
  Volume2,
  Send,
  RefreshCcw,
  Sparkles,
  User,
  Mic,
  Baby,
  Play,
  HeartPulse,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { VOCABULARY, VocabItem, Category } from './data/vocabulary';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_NAME = "gemini-1.5-flash";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Simulation scenarios
type SimulationScenario = 'anamnesis' | 'acute' | 'child' | 'admin' | 'hygiene';

const SCENARIOS: Record<SimulationScenario, { title: string; prompt: string; icon: any }> = {
  anamnesis: {
    title: 'První návštěva (Анамнез)',
    icon: FileText,
    prompt: 'You are Paní Dvořáková, a 45-year-old patient coming for a preventive checkup. You have slightly sensitive gums. The doctor needs to take your medical history. Respond in Czech. Use "Vykání".'
  },
  acute: {
    title: 'Akutní bolest (Гострий біль)',
    icon: AlertCircle,
    prompt: 'You are Pan Marek. You have severe pain in the lower left molar. It started yesterday and kept you awake at night. You are nervous and in pain. Speak Czech naturally, using phrases like "hrozné bolesti" or "nemohl jsem spát".'
  },
  child: {
    title: 'Dítě (Дитина)',
    icon: Baby,
    prompt: 'You are a 7-year-old child named Kubík. You are a bit scared of the drill. The dentist must use friendly language. You respond simply. If the dentist is nice, you calm down.'
  },
  admin: {
    title: 'Pojišťovna / Recepce',
    icon: CreditCard,
    prompt: 'You are at the reception. You forgot your insurance card but have a photo of it. You want to know how much a white filling costs.'
  },
  hygiene: {
    title: 'Dentální hygiena',
    icon: Smile,
    prompt: 'You are a patient who doesn\'t use interdental brushes. You are surprised that your gums are bleeding. Be defensive at first but open to advice.'
  }
};

const ETIQUETTE_NOTES = [
  { 
    title: "Vykání (Поважне звернення)", 
    text: "У чеській медицині обов'язково використовуйте «Vy». Звертайтеся до пацієнтів «Pane/Paní» + прізвище. Навіть до 15-річних підлітків краще звертатися на «Ви»."
  },
  { 
    title: "VZP та доплати", 
    text: "У Чехії страхова покриває лише базові послуги (Standard). Завжди попереджайте пацієнта, якщо матеріал або процедура платна (Nadstandard)."
  },
  { 
    title: "Komunikace u dětí", 
    text: "Замість 'injekce' (ін'єкція) використовуйте 'včelička' (бджілка). Замість 'vrtačka' (свердло) можна казати 'včelka co vrní' або 'sprcha'."
  }
];


export default function App() {
  const [activeTab, setActiveTab] = useState(VOCABULARY[0].id);
  const [activeLevel, setActiveLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEtiquette, setShowEtiquette] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);

  // Flashcards state
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Simulation State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSimulationLoading, setIsSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voices handling
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices.filter(v => v.lang.startsWith('cs') || v.lang.startsWith('sk') || v.lang.includes('cz')));
      
      const cz = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith('cs-') || 
        v.lang.toLowerCase() === 'cs' ||
        v.name.toLowerCase().includes('czech') ||
        v.name.toLowerCase().includes('čeština')
      );
      if (cz && !selectedVoiceName) {
        setSelectedVoiceName(cz.name);
      }
    };
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [selectedVoiceName]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[.*?\]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = 'cs-CZ';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
  };

  const flashcardItems = useMemo(() => {
    return VOCABULARY.flatMap(cat => cat.items).filter(i => activeLevel === 'all' || i.level === activeLevel);
  }, [activeLevel]);

  useEffect(() => {
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
  }, [activeLevel, showFlashcards]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSimulation = async (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setMessages([]);
    setSimulationError(null);
    setIsSimulationLoading(true);
    setShowSimulation(true);
    setShowEtiquette(false);
    setShowFlashcards(false);
    
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `System: ${SCENARIOS[scenario].prompt} 
      You are the patient. Start the conversation with a short greeting and state why you are here.
      Respond ONLY in Czech. 
      Keep it very short (1-2 sentences).`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (text) {
        setMessages([{ role: 'assistant', content: text.trim() }]);
        speak(text.trim());
      }
    } catch (error: any) {
      console.error("Simulation error:", error);
      setSimulationError("Nepodařilo se spustit simulaci.");
    } finally {
      setIsSimulationLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSimulationLoading || !selectedScenario) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setSimulationError(null);
    setIsSimulationLoading(true);

    try {
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        systemInstruction: `You are a Czech patient in a dental clinic. 
        Scenario: ${SCENARIOS[selectedScenario].title}.
        Patient Info: ${SCENARIOS[selectedScenario].prompt}.
        Rules:
        1. Always respond ONLY in Czech.
        2. Use formal address (Vy).
        3. Correct user's Czech mistakes in brackets [Like this] at the end of your message.
        4. Keep responses concise (max 3 sentences).`
      });
      
      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      });

      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();
      
      if (text) {
        setMessages(prev => [...prev, { role: 'assistant', content: text.trim() }]);
        speak(text.trim());
      } else {
        throw new Error("Prázdná odpověď.");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setSimulationError("Chyba při generování odpovědi.");
    } finally {
      setIsSimulationLoading(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Hlasové vyhledávání není ve vašem prohlížeči podporováno.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'cs-CZ';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsSimulationLoading(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsSimulationLoading(false);
    };

    recognition.onerror = () => {
      setIsSimulationLoading(false);
    };

    recognition.onend = () => {
      setIsSimulationLoading(false);
    };

    recognition.start();
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return null;
    const allItems: { category: string; item: VocabItem }[] = [];
    VOCABULARY.forEach(cat => {
      cat.items.forEach(item => {
        const search = searchQuery.toLowerCase();
        if (
          item.czech.toLowerCase().includes(search) ||
          item.ukrainian.toLowerCase().includes(search) ||
          item.note.toLowerCase().includes(search)
        ) {
          allItems.push({ category: cat.title, item });
        }
      });
    });
    return allItems;
  }, [searchQuery]);

  const activeCategory = VOCABULARY.find(c => c.id === activeTab)!;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Zubařský Průvodce</h1>
              <p className="text-xs text-slate-500 font-medium">Спеціалізована чеська для стоматологів 🇨🇿🇺🇦</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Hledat / Пошук..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full text-sm transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {searchQuery ? (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Результати пошуку ({filteredItems?.length})</h2>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Скасувати
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredItems?.length ? filteredItems.map((res, i) => (
                <VocabRow key={i} item={res.item} categoryLabel={res.category} onSpeak={speak} />
              )) : (
                <div className="p-12 text-center text-slate-400">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                  <p>На жаль, нічого не знайдено.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Nav Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-2 mb-4 no-scrollbar">
              {VOCABULARY.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { 
                    setActiveTab(cat.id); 
                    setShowSimulation(false); 
                    setShowEtiquette(false); 
                    setShowFlashcards(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                    !showSimulation && !showEtiquette && !showFlashcards && activeTab === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <cat.icon size={16} />
                  <span>{cat.title}</span>
                </button>
              ))}
              
              <button
                onClick={() => { 
                  setShowSimulation(false); 
                  setShowEtiquette(false);
                  setShowFlashcards(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  showFlashcards 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                }`}
              >
                <ChevronRight size={16} />
                <span>Karty</span>
              </button>

              <button
                onClick={() => { 
                  setShowSimulation(false); 
                  setShowEtiquette(true); 
                  setShowFlashcards(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  showEtiquette 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                }`}
              >
                <Info size={16} />
                <span>Etiketa</span>
              </button>

              <button
                onClick={() => {
                  setShowSimulation(true);
                  setShowFlashcards(false);
                  setShowEtiquette(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  showSimulation 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                  : 'bg-white text-purple-600 border border-purple-200 hover:border-purple-300'
                }`}
              >
                <Sparkles size={16} />
                <span>Praxe (AI)</span>
              </button>
            </div>

            {/* Level Filter */}
            {!showSimulation && !showEtiquette && !showFlashcards && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Úroveň:</span>
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                  {(['all', 'A1', 'A2', 'B1', 'B2'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setActiveLevel(lvl)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeLevel === lvl 
                        ? 'bg-blue-600 text-white shadow-md scale-105' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {lvl === 'all' ? 'VŠE' : lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {showFlashcards ? (
                <motion.section
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-8 py-8"
                >
                  <div className="w-full max-w-sm aspect-[3/4] relative perspective-1000">
                    <motion.div
                      className="w-full h-full relative transition-all duration-500 preserve-3d cursor-pointer"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      {/* Front: Czech */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-blue-100 p-8 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Чеська</span>
                        <h3 className="text-3xl font-bold text-slate-900 mb-6 uppercase tracking-tight">
                          {flashcardItems[currentFlashcardIndex]?.czech}
                        </h3>
                        <p className="text-blue-600 font-mono text-sm bg-blue-50 px-3 py-1 rounded-full">{flashcardItems[currentFlashcardIndex]?.pronunciation}</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); speak(flashcardItems[currentFlashcardIndex]?.czech); }}
                          className="mt-8 p-4 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          <Volume2 size={24} />
                        </button>
                        <p className="mt-auto text-[10px] text-slate-400 font-bold">НАТИСНІТЬ, ЩОБ ПЕРЕВЕРНУТИ</p>
                      </div>

                      {/* Back: Ukrainian */}
                      <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center text-white rotate-y-180">
                        <span className="text-[10px] font-black text-blue-200 opacity-60 uppercase tracking-widest mb-4">Українська</span>
                        <h3 className="text-3xl font-bold mb-4">
                          {flashcardItems[currentFlashcardIndex]?.ukrainian}
                        </h3>
                        <p className="text-blue-100/80 text-sm italic">{flashcardItems[currentFlashcardIndex]?.note}</p>
                        <p className="mt-auto text-[10px] text-blue-200/50 font-bold">НАТИСНІТЬ, ЩОБ ПОВЕРНУТИСЯ</p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => {
                        setCurrentFlashcardIndex(prev => (prev > 0 ? prev - 1 : flashcardItems.length - 1));
                        setIsFlipped(false);
                      }}
                      className="p-4 bg-white border border-slate-200 rounded-full shadow-sm hover:border-blue-300 transition-all"
                    >
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <span className="text-sm font-bold text-slate-500">{currentFlashcardIndex + 1} / {flashcardItems.length}</span>
                    <button 
                      onClick={() => {
                        setCurrentFlashcardIndex(prev => (prev < flashcardItems.length - 1 ? prev + 1 : 0));
                        setIsFlipped(false);
                      }}
                      className="p-4 bg-white border border-slate-200 rounded-full shadow-sm hover:border-blue-300 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.section>
              ) : showSimulation ? (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl shadow-xl border border-purple-100 flex flex-col h-[650px] max-h-[85vh] overflow-hidden"
                >
                   <div className="px-6 py-4 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-purple-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-500" />
                        AI Pacient
                      </h2>
                      <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Simulace reálné praxe</p>
                    </div>
                    <div className="flex items-center gap-2">
                       {/* Voice Selection */}
                       <div className="flex items-center gap-2 bg-purple-50 p-1 rounded-xl mr-2">
                          <Volume2 size={14} className="ml-1 text-purple-400" />
                          <select 
                            className="bg-transparent text-[10px] font-bold p-1 pr-6 outline-none border-none text-purple-700 cursor-pointer"
                            value={selectedVoiceName}
                            onChange={(e) => setSelectedVoiceName(e.target.value)}
                          >
                            {availableVoices.length > 0 ? (
                              availableVoices.map(v => (
                                <option key={v.name} value={v.name}>{v.name.split(' ')[0]} ({v.lang})</option>
                              ))
                            ) : (
                              <option>Systémový hlas</option>
                            )}
                          </select>
                       </div>
                       
                       <button 
                         onClick={() => setSelectedScenario(null)}
                         className="text-[10px] font-bold text-purple-700 bg-white px-3 py-1 rounded-full shadow-sm hover:shadow-md transition-all border border-purple-100"
                       >
                         Změnit scénář
                       </button>
                    </div>
                  </div>

                  {!selectedScenario ? (
                    <div className="flex-1 p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
                      <div className="col-span-full mb-2">
                        <h3 className="text-slate-800 font-bold mb-1">Виберіть сценарій для практики:</h3>
                        <p className="text-xs text-slate-500 font-medium">Gemini імітуватиме пацієнта та реагуватиме на вашу чеську</p>
                      </div>
                      {(Object.entries(SCENARIOS) as [SimulationScenario, typeof SCENARIOS.anamnesis][]).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => startSimulation(key)}
                          className="flex flex-col items-start p-5 rounded-2xl border-2 border-slate-50 hover:border-purple-200 hover:bg-purple-50/50 transition-all text-left"
                        >
                          <div className="p-2 bg-purple-100 text-purple-600 rounded-xl mb-3">
                            <value.icon size={24} />
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">{value.title}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{value.prompt}</p>
                          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-100/50 px-2 py-1 rounded-md">
                            <Play size={10} fill="currentColor" /> Spustit
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                        {simulationError && (
                          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <div className="text-xs font-medium">
                              <p className="font-bold">Chyba simulace</p>
                              <p className="opacity-80">{simulationError}</p>
                            </div>
                          </div>
                        )}
                        {messages.map((m, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-sm ${
                              m.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {m.content.split(/(\[.*?\])/).map((part, index) => (
                                  part.startsWith('[') && part.endsWith(']') 
                                  ? <span key={index} className="block mt-2 p-2 bg-purple-100/50 text-purple-800 rounded-lg text-[10px] font-bold border border-purple-200/50 italic">{part}</span>
                                  : part
                                ))}
                              </p>
                              {m.role === 'assistant' && (
                                <button 
                                  onClick={() => speak(m.content)}
                                  className="mt-3 p-1.5 hover:bg-slate-100 rounded-lg text-blue-500 transition-colors flex items-center gap-1.5 text-[10px] font-bold"
                                >
                                  <Volume2 size={12} /> Přehrát hlas pacienta
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        {isSimulationLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5">
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={startListening}
                            className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                              isSimulationLoading 
                              ? 'bg-slate-100 text-slate-300' 
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            }`}
                            title="Mluvit česky"
                          >
                            <Mic size={20} />
                          </button>
                          <form 
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="flex-1 flex gap-2"
                          >
                            <input 
                              type="text"
                              placeholder="Odpovězte česky... (např. 'Zkuste kousnout.')"
                              className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              disabled={isSimulationLoading}
                            />
                            <button 
                              type="submit"
                              disabled={isSimulationLoading || !input.trim()}
                              className="bg-purple-600 text-white w-12 h-12 rounded-2xl hover:bg-purple-700 transition-all disabled:opacity-50 shadow-md shadow-purple-100 flex items-center justify-center"
                            >
                              <Send size={20} />
                            </button>
                          </form>
                        </div>
                      </div>
                    </>
                  )}
                </motion.section>
              ) : showEtiquette ? (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ETIQUETTE_NOTES.map((note, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
                        <h3 className="font-bold text-blue-900 mb-2 border-b border-blue-50 pb-2 flex items-center gap-2">
                          <Info size={18} className="text-blue-400" />
                          {note.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              ) : (
                <motion.section
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{activeCategory.title}</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{activeCategory.titleUk}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {activeCategory.items
                      .filter(i => activeLevel === 'all' || i.level === activeLevel)
                      .map((item, i) => (
                        <VocabRow key={i} item={item} onSpeak={speak} />
                      ))}
                    {activeCategory.items.filter(i => activeLevel === 'all' || i.level === activeLevel).length === 0 && (
                      <div className="p-20 text-center text-slate-400">
                        <Smile size={40} className="mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-medium">V této kategorii nejsou žádné výrazy pro tuto úroveň.</p>
                      </div>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}

interface VocabRowProps {
  key?: string | number;
  item: VocabItem;
  categoryLabel?: string;
  onSpeak: (text: string) => void;
}

function VocabRow({ item, categoryLabel, onSpeak }: VocabRowProps) {
  return (
    <div className="group p-5 hover:bg-blue-50/30 transition-all flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 space-y-1">
        {categoryLabel && (
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 inline-block">
            {categoryLabel}
          </span>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{item.czech}</h3>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
              item.level === 'A1' ? 'bg-green-50 text-green-700 border-green-100' :
              item.level === 'A2' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
              item.level === 'B1' ? 'bg-orange-50 text-orange-700 border-orange-100' :
              'bg-red-50 text-red-700 border-red-100'
            }`}>
              {item.level}
            </span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onSpeak(item.czech); }}
            className="p-2.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded-xl transition-all border border-blue-50 bg-white shadow-sm"
            title="Přesná česká výslovnost"
          >
            <Volume2 size={18} />
          </button>
        </div>
        <p className="text-blue-600 font-mono text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block">{item.pronunciation}</p>
      </div>
      
      <div className="flex-1 space-y-1 md:border-l md:border-slate-100 md:pl-6">
        <h4 className="text-lg font-semibold text-slate-800 leading-tight">{item.ukrainian}</h4>
        <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium">
          <BookOpen size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
          <p className="leading-relaxed opacity-75">{item.note}</p>
        </div>
      </div>
    </div>
  );
}
