
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Device, Dashboard } from '../types';
import { chatWithCopilot } from '../geminiService';

interface AICopilotProps {
    devices: Device[];
    dashboards: Dashboard[];
    onNavigate: (pageId: string) => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({ devices, dashboards, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'ai', content: '你好！我是 AuraSense 智能助手。您可以问我关于设备状态的问题，或者让我带您去任何页面。', timestamp: Date.now() }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            const { text, action } = await chatWithCopilot(input, { devices, dashboards });
            
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: text,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);

            if (action && action.type === 'navigate') {
                // Short delay for UX
                setTimeout(() => {
                    onNavigate(action.payload.target);
                }, 1000);
            }

        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: 'Connection Error. Please try again.',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 h-[500px] bg-white/90 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-sm">AuraSense Copilot</h3>
                                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'ai' && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 mr-2 flex items-center justify-center text-[10px]">🤖</div>
                                )}
                                <div 
                                    className={`
                                        max-w-[80%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm
                                        ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none'}
                                        ${msg.role === 'system' ? 'bg-rose-50 text-rose-500 border-rose-100 w-full text-center' : ''}
                                    `}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 mr-2 flex items-center justify-center text-[10px]">🤖</div>
                                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-50">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about devices, or 'Go to inventory'..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder-slate-400"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isThinking}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group
                    ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:scale-110'}
                `}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <div className="relative">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-indigo-600"></span>
                    </div>
                )}
            </button>
        </div>
    );
};
