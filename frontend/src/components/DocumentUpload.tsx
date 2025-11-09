import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Theme } from '../App';

interface DocumentUploadProps {
  onUpload: (files: File[], persona: string) => void;
  isLoading: boolean;
  theme: Theme;
  documentCount: number;
  chunkCount: number;
  resetKey: number;
}

export function DocumentUpload({ onUpload, isLoading, theme, documentCount, chunkCount, resetKey }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [persona, setPersona] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedFiles([]);
    setPersona('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetKey]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      ['.pdf', '.docx', '.txt', '.md'].some(ext => file.name.toLowerCase().endsWith(ext))
    );
    
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles, persona);
    }
  };

  const cardBg = theme === 'modern' 
    ? 'bg-white border-emerald-200 shadow-lg shadow-emerald-100' 
    : 'bg-stone-900 border-stone-700 shadow-lg shadow-stone-950/50';

  const accentColor = theme === 'modern' ? 'text-slate-900' : 'text-stone-100';
  const buttonColor = theme === 'modern' 
    ? 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600' 
    : 'bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950';

  return (
    <Card className={cardBg}>
      <CardHeader>
        <CardTitle className={accentColor}>Upload Documents</CardTitle>
        <CardDescription className={theme === 'modern' ? 'text-slate-600' : 'text-stone-400'}>
          upload the documents to begin the conversation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragging 
              ? theme === 'modern' 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-amber-600 bg-stone-800'
              : theme === 'modern'
                ? 'border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                : 'border-stone-700 hover:border-amber-700 hover:bg-stone-800/50'
            }
          `}
        >
          <Upload className={`w-12 h-12 mx-auto mb-3 ${theme === 'modern' ? 'text-emerald-400' : 'text-amber-600'}`} />
          <p className={accentColor}>
            Click to browse files
          </p>
          <p className={`text-sm mt-1 ${theme === 'modern' ? 'text-slate-500' : 'text-stone-500'}`}>
            Supports: PDF, DOCX, TXT, MD
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className={accentColor}>Selected Files:</Label>
            <div className="space-y-1">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded ${theme === 'modern' ? 'bg-emerald-50' : 'bg-stone-800'}`}
                >
                  <FileText className={`w-4 h-4 ${theme === 'modern' ? 'text-emerald-600' : 'text-amber-500'}`} />
                  <span className={`text-sm ${theme === 'modern' ? 'text-slate-900' : 'text-stone-200'}`}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persona Input */}
        <div className="space-y-2">
          <Label htmlFor="persona" className={accentColor}>
            Character Name (Optional)
          </Label>
          <Input
            id="persona"
            placeholder="e.g., Renaissance Scholar, Medieval Historian"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className={theme === 'modern' 
              ? 'border-emerald-300 focus:ring-emerald-500' 
              : 'border-stone-700 focus:ring-amber-700 bg-stone-800 text-stone-100'}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={selectedFiles.length === 0 || isLoading}
          className={`w-full ${buttonColor} text-white`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Process
            </>
          )}
        </Button>

        {/* Upload Status */}
        {documentCount > 0 && (
          <div className={`flex items-start gap-2 p-3 rounded ${theme === 'modern' ? 'bg-green-50 border border-green-200' : 'bg-green-100 border border-green-300'}`}>
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800">
                Successfully processed {documentCount} document{documentCount !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-green-700">
                {chunkCount} chunks indexed
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
