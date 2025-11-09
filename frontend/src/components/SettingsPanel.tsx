import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Palette, Sparkles, Archive } from 'lucide-react';
import { Theme } from '../App';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function SettingsPanel({ open, onOpenChange, theme, onThemeChange }: SettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={theme === 'modern' ? 'bg-emerald-50' : 'bg-stone-900'}>
        <SheetHeader>
          <SheetTitle className={theme === 'modern' ? 'text-slate-900' : 'text-stone-100'}>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Settings
            </div>
          </SheetTitle>
          <SheetDescription className={theme === 'modern' ? 'text-slate-600' : 'text-stone-400'}>
            Customize your experience
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <Label className={theme === 'modern' ? 'text-slate-900' : 'text-stone-100'}>
              Theme
            </Label>
            <RadioGroup value={theme} onValueChange={(value) => onThemeChange(value as Theme)}>
              <div className="space-y-3">
                {/* Modern Theme */}
                <div
                  className={`relative flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    theme === 'modern'
                      ? 'border-emerald-500 bg-emerald-100'
                      : theme === 'historical'
                        ? 'border-stone-700 bg-stone-800 hover:border-stone-600'
                        : 'border-emerald-200 bg-white hover:border-emerald-300'
                  }`}
                  onClick={() => onThemeChange('modern')}
                >
                  <RadioGroupItem value="modern" id="modern" className="mt-1" />
                  <div className="flex-1">
                    <label
                      htmlFor="modern"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className={`w-5 h-5 ${theme === 'modern' ? 'text-emerald-700' : theme === 'historical' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      <div>
                        <p className={theme === 'modern' ? 'text-slate-900' : theme === 'historical' ? 'text-stone-200' : 'text-emerald-800'}>
                          Fun & Modern
                        </p>
                        <p className={`text-sm ${theme === 'modern' ? 'text-slate-700' : theme === 'historical' ? 'text-stone-400' : 'text-emerald-600'}`}>
                          Warm colors with greens, pinks, and blues
                        </p>
                      </div>
                    </label>
                    {/* Color Preview */}
                    <div className="mt-3 flex gap-2">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-sky-500" />
                      <div className="w-8 h-8 rounded bg-pink-100" />
                      <div className="w-8 h-8 rounded bg-emerald-100" />
                    </div>
                  </div>
                </div>

                {/* Historical Theme */}
                <div
                  className={`relative flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    theme === 'historical'
                      ? 'border-amber-700 bg-stone-800'
                      : theme === 'modern'
                        ? 'border-stone-300 bg-white hover:border-stone-400'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                  onClick={() => onThemeChange('historical')}
                >
                  <RadioGroupItem value="historical" id="historical" className="mt-1" />
                  <div className="flex-1">
                    <label
                      htmlFor="historical"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Archive className={`w-5 h-5 ${theme === 'historical' ? 'text-amber-400' : 'text-stone-600'}`} />
                      <div>
                        <p className={theme === 'historical' ? 'text-stone-100' : 'text-stone-800'}>
                          Historical
                        </p>
                        <p className={`text-sm ${theme === 'historical' ? 'text-stone-400' : 'text-stone-600'}`}>
                          Cool darker browns and beiges
                        </p>
                      </div>
                    </label>
                    {/* Color Preview */}
                    <div className="mt-3 flex gap-2">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-900 to-stone-800" />
                      <div className="w-8 h-8 rounded bg-stone-800" />
                      <div className="w-8 h-8 rounded bg-stone-900" />
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Info */}
          <div className={`p-4 rounded-lg ${theme === 'modern' ? 'bg-emerald-100 border border-emerald-200' : 'bg-stone-800 border border-stone-700'}`}>
            <p className={`text-sm ${theme === 'modern' ? 'text-slate-900' : 'text-stone-300'}`}>
              The theme affects the overall color scheme and visual style of the application, 
              creating either a vibrant modern experience or a classic historical atmosphere.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
