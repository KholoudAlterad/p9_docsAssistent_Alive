import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, BookOpen } from 'lucide-react';
import { Theme, Citation } from '../App';

interface CitationPanelProps {
  citations: Citation[];
  theme: Theme;
}

export function CitationPanel({ citations, theme }: CitationPanelProps) {
  const cardBg = theme === 'modern' 
    ? 'bg-white border-emerald-200 shadow-lg shadow-emerald-100' 
    : 'bg-stone-900 border-stone-700 shadow-lg shadow-stone-950/50';

  const accentColor = theme === 'modern' ? 'text-slate-900' : 'text-stone-100';
  
  // Show top 3 citations
  const topCitations = citations.slice(0, 3);

  return (
    <Card className={cardBg}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${accentColor}`}>
          <BookOpen className="w-5 h-5" />
          Sources & Citations
        </CardTitle>
        <CardDescription className={theme === 'modern' ? 'text-slate-600' : 'text-stone-400'}>
          Top references from the last response
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCitations.map((citation, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${theme === 'modern' ? 'bg-pink-50/50 border-pink-200' : 'bg-stone-800/50 border-stone-700'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded ${theme === 'modern' ? 'bg-emerald-100' : 'bg-amber-900'} flex items-center justify-center flex-shrink-0`}>
                <FileText className={`w-4 h-4 ${theme === 'modern' ? 'text-emerald-600' : 'text-amber-300'}`} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className={accentColor}>
                    {citation.filename}
                  </p>
                  {citation.page && (
                    <Badge variant="secondary" className={theme === 'modern' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-900 text-amber-200'}>
                      Page {citation.page}
                    </Badge>
                  )}
                </div>
                <p className={`text-sm ${theme === 'modern' ? 'text-slate-700' : 'text-stone-300'}`}>
                  "{citation.snippet}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
