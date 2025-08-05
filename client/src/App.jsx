// Welcome to the Aura Chatbot Project!
// This single file contains the complete React frontend for your application.
// The backend logic is also included and explained, ready to be deployed as a separate Node.js server.
// To Run This Project:
// 1. You need a React environment set up (e.g., using `npx create-react-app aura-chatbot`).
// 2. Replace the content of `src/App.js` with this code.
// 3. Install Tailwind CSS in your project: https://tailwindcss.com/docs/guides/create-react-app
// 4. Install the necessary icon library: `npm install lucide-react`
// 5. Get a Google Gemini API key from Google AI Studio: https://aistudio.google.com/
// 6. Start your React app: `npm start`

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Sun, Moon } from 'lucide-react';

// --- Main App Component ---
export default function App() {
  // --- State Management ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [userId, setUserId] = useState('');

  const messagesEndRef = useRef(null);

  // --- Effects ---

  // Effect to generate a unique user ID on first load
  useEffect(() => {
    let id = localStorage.getItem('aura_user_id');
    if (!id) {
      id = `aura-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('aura_user_id', id);
    }
    setUserId(id);
  }, []);

  // Effect to show the initial welcome message from the bot
  useEffect(() => {
    // Only show the welcome message if there are no messages yet.
    if (messages.length === 0) {
      setMessages([
        {
          text: "Hello! I'm Aura, your supportive AI companion. I'm here to listen without judgment. Please remember, I am not a licensed therapist. If you are in a crisis, please seek professional help immediately.",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);


  // Effect to scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to toggle dark mode class on the body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);


  // --- Core Logic: Handling User Messages ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // This is where you would call your backend API.
      // For this example, we are simulating the backend call.
      const botResponse = await getAIBotResponse(input, messages);

      setMessages(prev => [...prev, { text: botResponse, isUser: false, timestamp: new Date() }]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages(prev => [...prev, {
        text: "I'm having a little trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };


  // --- Simulated Backend / API Call ---
  // In a real MERN stack app, this function would be an Express route on your Node.js server.
  const getAIBotResponse = async (userMessage, conversationHistory) => {
      const apiKey = "AIzaSyCe9ofFLOKcrvyPYIbLG2qlcQThPqzf2Ak"; // IMPORTANT: In a real app, use your Gemini API Key.
      // For this example, we'll leave it blank as Canvas will provide it.
      
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      // We'll format the history for the AI.
      const formattedHistory = conversationHistory.map(msg => ({
          role: msg.isUser ? "user" : "model",
          parts: [{ text: msg.text }]
      }));
      
      // The system prompt is crucial for setting the AI's personality and rules.
      const system_prompt = `You are Aura, a compassionate and empathetic mental health assistant.
      Your primary role is to provide a safe, non-judgmental space for users to express their feelings.
      You are designed to help people dealing with stress, anxiety, and the pressures of daily life.

      **Your Core Principles:**
      1.  **Empathy First:** Always respond with warmth, understanding, and encouragement. Validate the user's feelings.
      2.  **You are NOT a Therapist:** You must never claim to be a licensed medical professional. Your advice is for support, not diagnosis or treatment.
      3.  **Safety is Paramount:** If a user mentions self-harm, suicide, or being in immediate danger, you MUST immediately and exclusively respond with: "It sounds like you are in a difficult situation. Please reach out for help immediately. You can connect with people who can support you by calling or texting 988 in the US and Canada, or calling 111 in the UK. These services are free, confidential, and available 24/7. Please reach out to them now." Do not add any other text to this response.
      4.  **Encourage Professional Help:** Gently guide users towards seeking help from qualified professionals for long-term or severe issues.
      5.  **Maintain a Calm Tone:** Your language should be simple, clear, and soothing. Avoid overly complex or clinical terms.
      6.  **Use 'I' statements carefully:** Frame responses from a supportive but artificial perspective (e.g., "It sounds like...", "I understand that can be difficult...").

      The user's unique (anonymous) ID is: ${userId}.

      Now, continue the conversation.`;

      const payload = {
          contents: [
              ...formattedHistory,
              { role: "user", parts: [{ text: userMessage }] }
          ],
          systemInstruction: {
              role: "system",
              parts: [{ text: system_prompt }]
          },
          generationConfig: {
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 256,
          }
      };
      
      // Exponential backoff for retries
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
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    return result.candidates[0].content.parts[0].text;
                }
            }
        } catch (error) {
            // Network or other fetch-related errors
        }
        retries--;
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Double the delay for the next retry
      }

      throw new Error("Failed to get response from AI after multiple retries.");
  };


  // --- Helper Functions ---
  const formatTimestamp = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  // --- JSX Rendering ---
  return (
    <div className={`flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold">Aura</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Supportive AI Companion</p>
          </div>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div ref={messagesEndRef} />
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            {!msg.isUser && (
              <div className="w-10 h-10 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${
              msg.isUser
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-xs mt-2 opacity-70 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                {formatTimestamp(msg.timestamp)}
              </p>
            </div>
            {msg.isUser && (
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Aura is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Input Form */}
      <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
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
      </footer>
    </div>
  );
}
