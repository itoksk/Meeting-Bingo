import React, { useState } from 'react';
import { GameSettings, Language } from '../types';
import { Button } from './Button';
import { getRoleSuggestions } from '../services/geminiService';
import { TRANSLATIONS } from '../translations';

interface SetupFormProps {
  onStart: (settings: GameSettings) => void;
  isLoading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStart, isLoading, language, setLanguage }) => {
  const t = TRANSLATIONS[language];
  const [topic, setTopic] = useState('');
  const [industry, setIndustry] = useState('');
  
  // Role management
  const [roles, setRoles] = useState<string[]>([]);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState('');
  const [isSuggestingRoles, setIsSuggestingRoles] = useState(false);

  const handleGetSuggestions = async () => {
    if (!topic) return;
    setIsSuggestingRoles(true);
    const suggestions = await getRoleSuggestions(topic, industry, language);
    setSuggestedRoles(suggestions);
    setIsSuggestingRoles(false);
  };

  const toggleRole = (role: string) => {
    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const addCustomRole = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customRole.trim()) {
      e.preventDefault();
      if (!roles.includes(customRole.trim())) {
        setRoles([...roles, customRole.trim()]);
      }
      setCustomRole('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onStart({ topic, roles, industry, language });
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-8 bg-white rounded-3xl shadow-xl border border-slate-100 relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
        >
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t.title}</h1>
        <p className="text-slate-500">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">
            {t.topicLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="topic"
            required
            placeholder={t.topicPlaceholder}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">
            {t.industryLabel}
          </label>
          <input
            type="text"
            id="industry"
            placeholder={t.industryPlaceholder}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700">
              {t.rolesLabel}
            </label>
            <button
              type="button"
              onClick={handleGetSuggestions}
              disabled={!topic || isSuggestingRoles}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1"
            >
              {isSuggestingRoles ? (
                 <span className="animate-pulse">{t.thinking}</span>
              ) : (
                <>✨ {t.suggestRoles}</>
              )}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {roles.map(role => (
              <span key={`selected-${role}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {role}
                <button 
                  type="button"
                  onClick={() => toggleRole(role)}
                  className="ml-2 text-indigo-600 hover:text-indigo-900 focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <input
            type="text"
            placeholder={roles.length === 0 ? t.addRolePlaceholder : "..."}
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            onKeyDown={addCustomRole}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
          />

          {suggestedRoles.length > 0 && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block mb-2">{t.suggestionsLabel}</span>
              <div className="flex flex-wrap gap-2">
                {suggestedRoles.filter(r => !roles.includes(r)).map((role) => (
                  <button
                    key={`sug-${role}`}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          {t.generateButton}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-xs text-slate-400">
        {t.poweredBy}
      </div>
    </div>
  );
};
