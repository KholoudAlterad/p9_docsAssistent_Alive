import { useState, useEffect } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { ChatArea } from './components/ChatArea';
import { CitationPanel } from './components/CitationPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Toaster, toast } from 'sonner';
import { Settings, RotateCcw } from 'lucide-react';
import LogoImage from '../ChatGPT Image Nov 9, 2025, 03_33_07 PM.png';

export type Theme = 'modern' | 'historical';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface Citation {
  filename: string;
  page?: number;
  snippet: string;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>('historical');
  const [sessionId, setSessionId] = useState<string>('');
  const [persona, setPersona] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedCitations, setSelectedCitations] = useState<Citation[]>([]);
  const [uploadResetKey, setUploadResetKey] = useState(0);

  const API_BASE: string = (import.meta as any)?.env?.VITE_API_BASE ?? '/api';

  // Bootstrap session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/session`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to create session');
        const data = await res.json();
        setSessionId(data.session_id);
        toast.success('Session initialized');
      } catch (e) {
        setError('Could not initialize session. Please refresh.');
        toast.error('Session initialization failed');
      }
    };
    createSession();
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleUpload = async (files: File[], personaName: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const form = new FormData();
      form.append('session_id', sessionId);
      if (personaName) form.append('persona', personaName);
      for (const f of files) {
        form.append('files', f);
      }
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Upload failed');
      }
      const data = await res.json();
      setPersona(personaName || '');
      setDocumentCount(data.documents || 0);
      setChunkCount(data.chunks || 0);
      setDocumentsUploaded(true);
      toast.success(`Uploaded ${data.documents} document(s), indexed ${data.chunks} chunks`);
    } catch (err) {
      setError('Failed to upload documents. Please try again.');
      toast.error('Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!documentsUploaded) {
      setError('Please upload documents before chatting.');
      toast.error('Upload documents first');
      return;
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, message }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Chat failed');
      }
      const data = await res.json();
      const mappedCitations: Citation[] = (data.citations || []).map((c: any) => ({
        filename: c.source || 'Source',
        page: c.page,
        snippet: c.snippet,
      }));
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.answer || '',
        citations: mappedCitations,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, assistantMessage]);
      setSelectedCitations(mappedCitations);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      toast.error('Message failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      // Reset current session
      await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      // Start a new session
      const res = await fetch(`${API_BASE}/session`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.session_id);

      // Clear UI state
      setChatHistory([]);
      setPersona('');
      setDocumentsUploaded(false);
      setDocumentCount(0);
      setChunkCount(0);
      setSelectedCitations([]);
      setError('');
      setUploadResetKey((prev) => prev + 1);
      toast.success('Conversation reset');
    } catch (err) {
      toast.error('Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'modern' ? 'bg-gradient-to-br from-emerald-50 via-pink-50 to-sky-50' : 'bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950'}`}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className={`border-b ${theme === 'modern' ? 'bg-white/80 border-emerald-200' : 'bg-stone-950/80 border-stone-800'} backdrop-blur-sm sticky top-0 z-50`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={LogoImage}
                alt="Historical Archive Assistant logo"
                className="h-10 w-10 rounded-lg object-contain"
              />
              <div>
                <h1 className={theme === 'modern' ? 'text-slate-900' : 'text-stone-100'}>
                  Alive
                </h1>
                {persona && (
                  <p className={`text-sm ${theme === 'modern' ? 'text-emerald-700' : 'text-amber-400'}`}>
                    Active Persona: {persona}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {documentsUploaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isLoading}
                  className={theme === 'modern' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-stone-700 text-amber-300 hover:bg-stone-900'}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className={theme === 'modern' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-stone-700 text-amber-300 hover:bg-stone-900'}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Citations */}
          <div className="space-y-6">
            <DocumentUpload
              onUpload={handleUpload}
              isLoading={isLoading}
              theme={theme}
              documentCount={documentCount}
              chunkCount={chunkCount}
              resetKey={uploadResetKey}
            />
            
            {selectedCitations.length > 0 && (
              <CitationPanel citations={selectedCitations} theme={theme} />
            )}
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <ChatArea
              messages={chatHistory}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              theme={theme}
              persona={persona}
              onCitationClick={setSelectedCitations}
            />
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}
