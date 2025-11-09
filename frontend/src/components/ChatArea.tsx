import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Send, Loader2, User, Sparkles } from 'lucide-react';
import { Theme, Message } from '../App';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  theme: Theme;
  persona: string;
  onCitationClick: (citations: any[]) => void;
}

export function ChatArea({ messages, onSendMessage, isLoading, theme, persona, onCitationClick }: ChatAreaProps) {
  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const cardBg = theme === 'modern' 
    ? 'bg-white border-emerald-200 shadow-lg shadow-emerald-100' 
    : 'bg-stone-900 border-stone-700 shadow-lg shadow-stone-950/50';

  const accentColor = theme === 'modern' ? 'text-slate-900' : 'text-stone-100';

  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)] gap-4">
      <Card className={`${cardBg} flex-1 flex flex-col`}>
        <CardHeader>
          <CardTitle className={accentColor}>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Chat Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="px-6">
              <div className="space-y-4 py-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className={`w-16 h-16 mx-auto mb-4 ${theme === 'modern' ? 'text-emerald-300' : 'text-stone-600'}`} />
                    <p className={`${theme === 'modern' ? 'text-slate-600' : 'text-stone-400'}`}>
                      Upload their words and let them speak again.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className={`w-8 h-8 rounded-full ${theme === 'modern' ? 'bg-gradient-to-br from-emerald-500 to-pink-500' : 'bg-gradient-to-br from-amber-900 to-stone-800'} flex items-center justify-center flex-shrink-0`}>
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div className={`flex flex-col gap-2 max-w-[80%]`}>
                        <div
                          className={`rounded-lg p-4 ${
                            message.role === 'user'
                              ? theme === 'modern'
                                ? 'bg-gradient-to-br from-emerald-500 to-sky-500 text-white'
                                : 'bg-gradient-to-br from-amber-800 to-amber-900 text-white'
                              : theme === 'modern'
                                ? 'bg-pink-50 border border-pink-200'
                                : 'bg-stone-800 border border-stone-700'
                          }`}
                        >
                          <p className={message.role === 'assistant' ? (theme === 'modern' ? 'text-slate-900' : 'text-stone-100') : ''}>
                            {message.content}
                          </p>
                        </div>

                        {message.citations && message.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {message.citations.map((citation, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={`cursor-pointer ${theme === 'modern' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-100' : 'border-amber-700 text-amber-300 hover:bg-stone-800'}`}
                                onClick={() => onCitationClick(message.citations || [])}
                              >
                                {citation.filename}
                                {citation.page && ` (p.${citation.page})`}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className={`text-xs ${theme === 'modern' ? 'text-slate-500' : 'text-stone-500'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className={`w-8 h-8 rounded-full ${theme === 'modern' ? 'bg-sky-200' : 'bg-amber-900'} flex items-center justify-center flex-shrink-0`}>
                          <User className={`w-5 h-5 ${theme === 'modern' ? 'text-sky-700' : 'text-amber-200'}`} />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${theme === 'modern' ? 'bg-gradient-to-br from-emerald-500 to-pink-500' : 'bg-gradient-to-br from-amber-900 to-stone-800'} flex items-center justify-center flex-shrink-0`}>
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className={`rounded-lg p-4 ${theme === 'modern' ? 'bg-pink-50 border border-pink-200' : 'bg-stone-800 border border-stone-700'}`}>
                      <Loader2 className={`w-5 h-5 animate-spin ${theme === 'modern' ? 'text-emerald-600' : 'text-amber-400'}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div
        className={`rounded-xl border p-4 ${
          theme === 'modern'
            ? 'border-emerald-200 bg-white shadow-lg shadow-emerald-100'
            : 'border-stone-700 bg-stone-900 shadow-lg shadow-stone-950/50'
        }`}
      >
        <div className="relative">
          <textarea
            placeholder={persona ? `Chat with ${persona}...` : 'Type your message...'}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className={`w-full resize-none rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 ${
              theme === 'modern' 
                ? 'border border-emerald-300 focus:ring-emerald-500 bg-white' 
                : 'border border-stone-700 focus:ring-amber-700 bg-stone-800 text-stone-100 placeholder:text-stone-500'
            }`}
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputMessage.trim() || isLoading}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
              !inputMessage.trim() || isLoading
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'modern'
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white'
                  : 'bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
