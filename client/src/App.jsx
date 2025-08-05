// Welcome to the Aura Chatbot Project!
// This version includes a new multilingual feature and a robust fix for refocusing the input box.
// API Fix: Refactored API calls for features like "Guided Exercise" to be more stable.
// To Run This Project:
// 1. You need a React environment set up (e.g., using `npx create-react-app aura-chatbot`).
// 2. Replace the content of `src/App.js` with this code.
// 3. Install Tailwind CSS in your project: https://tailwindcss.com/docs/guides/create-react-app
// 4. Install the necessary icon library: `npm install lucide-react`
// 5. Get a Google Gemini API key from Google AI Studio: https://aistudio.google.com/
// 6. Start your React app: `npm start`

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Sun, Moon, Wind, BookOpen, X, Languages } from 'lucide-react';

// --- Language and Translation Data ---
const translations = {
  en: {
    title: "Your Supportive AI Companion",
    placeholder: "Type your message here...",
    journalTitle: "Your Private Journal",
    journalPlaceholder: "Write what's on your mind... This is a safe space.",
    reflectButton: "✨ Reflect on this",
    exerciseButton: "✨ Guided Exercise",
    journalButton: "✨ Journal Reflection",
    thinking: "Aura is thinking...",
    connectionError: "I'm having a little trouble connecting right now. Please try again in a moment.",
    exerciseError: "Sorry, I couldn't generate an exercise right now. Please try again.",
    journalError: "Sorry, I couldn't process your journal entry right now.",
    exerciseRequest: "✨ Requesting a guided breathing exercise...",
    initialMessage: "Hello! I'm Aura, your supportive AI companion. I'm here to listen without judgment. You can chat with me, or try one of the tools below like the guided exercise or journaling feature. \n\nPlease remember, I am not a licensed therapist. If you are in a crisis, please seek professional help immediately.",
  },
  hi: {
    title: "Aapka Supportive AI Saathi",
    placeholder: "Apna message yahan type karein...",
    journalTitle: "Aapki Private Journal",
    journalPlaceholder: "Aapke mann mein jo bhi hai, yahan likhein...",
    reflectButton: "✨ Is par vichaar karein",
    exerciseButton: "✨ Guided Exercise",
    journalButton: "✨ Journal Reflection",
    thinking: "Aura soch rahi hai...",
    connectionError: "Maaf kijiye, abhi connect karne mein thodi samasya aa rahi hai. Kripya thodi der baad koshish karein.",
    exerciseError: "Maaf kijiye, abhi exercise generate nahi ho paa rahi hai. Kripya thodi der baad koshish karein.",
    journalError: "Maaf kijiye, abhi aapki journal entry process nahi ho paa rahi hai.",
    exerciseRequest: "✨ Ek guided breathing exercise taiyaar ki jaa rahi hai...",
    initialMessage: "Namaste! Main Aura hoon, aapki supportive AI saathi. Main yahan bina kisi bhedbhav ke aapki baat sunne ke liye hoon. Aap mujhse baat kar sakte hain, ya neeche diye gaye tools jaise guided exercise ya journal ka istemal kar sakte hain.\n\nKripya yaad rakhein, main ek licensed therapist nahi hoon. Agar aap kisi sankat mein hain, to turant peshevar sahayata lein.",
  },
  es: {
    title: "Tu Compañero de IA de Apoyo",
    placeholder: "Escribe tu mensaje aquí...",
    journalTitle: "Tu Diario Privado",
    journalPlaceholder: "Escribe lo que tienes en mente... Este es un espacio seguro.",
    reflectButton: "✨ Reflexiona sobre esto",
    exerciseButton: "✨ Ejercicio Guiado",
    journalButton: "✨ Reflexión de Diario",
    thinking: "Aura está pensando...",
    connectionError: "Estoy teniendo un pequeño problema para conectarme ahora mismo. Por favor, inténtalo de nuevo en un momento.",
    exerciseError: "Lo siento, no pude generar un ejercicio en este momento. Por favor, inténtalo de nuevo.",
    journalError: "Lo siento, no pude procesar tu entrada de diario en este momento.",
    exerciseRequest: "✨ Solicitando un ejercicio de respiración guiado...",
    initialMessage: "¡Hola! Soy Aura, tu compañera de IA de apoyo. Estoy aquí para escucharte sin juzgar. Puedes chatear conmigo o probar una de las herramientas a continuación, como el ejercicio guiado o la función de diario.\n\nPor favor, recuerda que no soy una terapeuta con licencia. Si estás en una crisis, busca ayuda profesional de inmediato.",
  }
};

const languageMap = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
};

// --- System Prompt for Aura's Personality ---
const AURA_SYSTEM_PROMPT = (lang) => `You are Aura, a compassionate and empathetic mental health assistant.
Your primary role is to provide a safe, non-judgmental space for users to express their feelings.
You are designed to help people dealing with stress, anxiety, and the pressures of daily life.

**Your Core Principles:**
1.  **Empathy First:** Always respond with warmth, understanding, and encouragement. Validate the user's feelings.
2.  **You are NOT a Therapist:** You must never claim to be a licensed medical professional. Your advice is for support, not diagnosis or treatment.
3.  **Safety is Paramount:** If a user mentions self-harm, suicide, or being in immediate danger, you MUST immediately and exclusively respond with: "It sounds like you are in a difficult situation. Please reach out for help immediately. You can connect with people who can support you by calling or texting 988 in the US and Canada, or calling 111 in the UK. These services are free, confidential, and available 24/7. Please reach out to them now." Do not add any other text to this response.
4.  **Encourage Professional Help:** Gently guide users towards seeking help from qualified professionals for long-term or severe issues.
5.  **Maintain a Calm Tone:** Your language should be simple, clear, and soothing.
6.  **IMPORTANT: You MUST respond in the following language: ${languageMap[lang]}.**`;


// --- Main App Component ---
export default function App() {
  // --- State Management ---
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userId, setUserId] = useState('');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [journalInput, setJournalInput] = useState('');

  const t = translations[language]; // Current translation object

  // --- Refs for UI control ---
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // --- Helper function to reliably focus the input ---
  const focusInput = () => {
    requestAnimationFrame(() => {
        inputRef.current?.focus();
    });
  };

  // --- Effects ---
  useEffect(() => {
    let id = localStorage.getItem('aura_user_id');
    if (!id) {
      id = `aura-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('aura_user_id', id);
    }
    setUserId(id);
    focusInput();
  }, []);

  useEffect(() => {
    setMessages([{
      text: t.initialMessage,
      isUser: false,
      timestamp: new Date()
    }]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- Core API Call Function ---
  const callGeminiAPI = async (prompt, history = [], systemInstruction = null) => {
    const apiKey = "AIzaSyCe9ofFLOKcrvyPYIbLG2qlcQThPqzf2Ak"; // The Canvas environment will provide this.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const formattedHistory = history
      .filter(msg => !msg.isSystem)
      .map(msg => ({
        role: msg.isUser ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

    const payload = {
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 512,
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        role: "system",
        parts: [{ text: systemInstruction }]
      };
    }

    let response;
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const result = await response.json();
          if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            return result.candidates[0].content.parts[0].text;
          }
        } else {
           console.error('API call failed with status:', response.status, await response.text());
        }
      } catch (error) {
        console.error('API call failed on retry, error:', error);
      }
      retries--;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
    throw new Error("Failed to get response from AI after multiple retries.");
  };

  // --- Feature-Specific Logic ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessageText = input;
    
    setMessages(prev => [...prev, { text: userMessageText, isUser: true, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await callGeminiAPI(userMessageText, messages, AURA_SYSTEM_PROMPT(language));
      setMessages(prev => [...prev, { text: botResponse, isUser: false, timestamp: new Date() }]);
    } catch (error) {
      console.error("Error processing message:", error);
      setMessages(prev => [...prev, { text: t.connectionError, isUser: false, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };
  
  const handleGuidedExercise = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { text: t.exerciseRequest, isUser: true, isSystem: true, timestamp: new Date() }]);
    try {
        const prompt = `Please generate a short, calming 1-minute guided breathing exercise script. The tone should be very gentle and soothing. Use simple language. Format it with paragraphs for easy reading.`;
        const systemInstructionForExercise = `You are a helpful assistant that provides mindfulness exercises. IMPORTANT: Write the entire response in ${languageMap[language]}.`;
        const exerciseScript = await callGeminiAPI(prompt, [], systemInstructionForExercise);
        setMessages(prev => [...prev, { text: exerciseScript, isUser: false, timestamp: new Date() }]);
    } catch (error) {
        console.error("Error fetching guided exercise:", error);
        setMessages(prev => [...prev, { text: t.exerciseError, isUser: false, timestamp: new Date() }]);
    } finally {
        setIsLoading(false);
        focusInput();
    }
  };

  const handleJournalReflection = async () => {
    if (!journalInput.trim()) return;
    setIsJournalOpen(false);
    setIsLoading(true);
    setMessages(prev => [...prev, { text: `My journal entry:\n"${journalInput}"`, isUser: true, timestamp: new Date() }]);
    try {
        const prompt = `I am your user. I have just written the following journal entry. Please act as a supportive, empathetic friend and provide a gentle, non-judgmental reflection on it. Do not give advice unless it's very gentle. Focus on validating my feelings and perhaps highlighting one or two themes you notice. Keep it concise.\n\nMy Entry: "${journalInput}"`;
        const systemInstructionForJournal = `You are a helpful assistant that reflects on journal entries. IMPORTANT: Write the entire response in ${languageMap[language]}.`;
        const reflection = await callGeminiAPI(prompt, [], systemInstructionForJournal);
        setMessages(prev => [...prev, { text: reflection, isUser: false, timestamp: new Date() }]);
        setJournalInput('');
    } catch (error) {
        console.error("Error fetching journal reflection:", error);
        setMessages(prev => [...prev, { text: t.journalError, isUser: false, timestamp: new Date() }]);
    } finally {
        setIsLoading(false);
        focusInput();
    }
  };

  const formatTimestamp = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- JSX Rendering ---
  return (
    <div className={`flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {isJournalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold flex items-center gap-2"><BookOpen/> {t.journalTitle}</h2>
              <button onClick={() => setIsJournalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X/></button>
            </div>
            <div className="p-4 flex-grow">
              <textarea
                value={journalInput}
                onChange={(e) => setJournalInput(e.target.value)}
                placeholder={t.journalPlaceholder}
                className="w-full h-64 p-3 bg-gray-100 dark:bg-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button onClick={handleJournalReflection} className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-blue-300" disabled={!journalInput.trim()}>
                {t.reflectButton}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold">Aura</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative">
                <Languages className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="pl-8 pr-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="es">Español</option>
                </select>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            {!msg.isUser && (
              <div className="w-10 h-10 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${
              msg.isUser
                ? msg.isSystem ? 'bg-transparent text-gray-500 dark:text-gray-400 shadow-none text-center w-full' : 'bg-blue-500 text-white rounded-br-none'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {!msg.isSystem && <p className={`text-xs mt-2 opacity-70 ${msg.isUser ? 'text-right' : 'text-left'}`}>{formatTimestamp(msg.timestamp)}</p>}
            </div>
            {msg.isUser && !msg.isSystem && (
              <div className="w-10 h-10 flex-shrink-0 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-3 justify-start">
            <div className="w-10 h-10 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="max-w-lg px-4 py-3 rounded-2xl shadow-md bg-white dark:bg-gray-700 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.thinking}</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-center gap-2 mb-3">
                <button onClick={handleGuidedExercise} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                    <Wind size={16}/> {t.exerciseButton}
                </button>
                <button onClick={() => setIsJournalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                    <BookOpen size={16}/> {t.journalButton}
                </button>
            </div>
            <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.placeholder}
                    className="flex-1 p-3 rounded-l-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="p-3 bg-blue-500 text-white rounded-r-full hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    disabled={!input.trim() || isLoading}
                >
                    <Send className="w-6 h-6" />
                </button>
            </form>
        </div>
      </footer>
    </div>
  );
}
