"use client";

import { useState } from "react";
import { Send, User, Stethoscope, Clock } from "lucide-react";

export default function AskPharmacist() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    { sender: "pharmacist", text: "Hello! I'm Dr. Osei, a licensed pharmacist. How can I help you with your medications today?", time: "10:00 AM" }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Add user message
    setChat([...chat, { sender: "user", text: message, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setMessage("");

    // Simulate response
    setTimeout(() => {
      setChat(prev => [...prev, { 
        sender: "pharmacist", 
        text: "Thank you for your question. A pharmacist will review this and respond shortly.", 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      }]);
    }, 1000);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Pharmacist</h1>
          <p className="text-gray-600">Free, confidential advice from our licensed professionals.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <Stethoscope size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-bold">Pharmacist Consultation</h2>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> Online
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock size={14} /> Avg. response time: 5 mins
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-grow p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
            <div className="text-center text-xs text-gray-400 mb-4">Today</div>
            
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex max-w-[80%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'} gap-3`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Stethoscope size={16} />}
                </div>
                <div>
                  <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question about medication, dosage, side effects..."
                className="flex-grow border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <button 
                type="submit"
                disabled={!message.trim()}
                className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center w-12"
              >
                <Send size={20} />
              </button>
            </form>
            <div className="text-xs text-gray-400 mt-2 text-center">
              For medical emergencies, please call an ambulance or visit the nearest hospital immediately.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}