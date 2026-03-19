import React, { useState } from 'react';
import { AuthProvider, useAuth, AuthButton } from './components/Auth';
import { TopicList, Topic } from './components/TopicList';
import { SpeakingPractice } from './components/SpeakingPractice';
import { History } from './components/History';
import { BookOpen, History as HistoryIcon, User as UserIcon, Sparkles, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AppContent: React.FC = () => {
  const { user, loading, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'topics' | 'history' | 'profile'>('topics');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium">Loading Stimuler AI...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl p-12 shadow-xl border border-gray-100"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Stimuler AI</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Your personal IELTS Speaking Coach. Get instant band scores and detailed feedback to ace your exam.
          </p>
          <AuthButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 md:pl-20">
      {/* Sidebar Navigation (Desktop) */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-100 flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          {[
            { id: 'topics', icon: BookOpen, label: 'Topics' },
            { id: 'history', icon: HistoryIcon, label: 'History' },
            { id: 'profile', icon: UserIcon, label: 'Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedTopic(null);
              }}
              className={cn(
                "p-3 rounded-xl transition-all group relative",
                activeTab === tab.id ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              <tab.icon className="w-6 h-6" />
              <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        
        <AuthButton />
      </nav>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-4 z-50 shadow-lg">
        {[
          { id: 'topics', icon: BookOpen, label: 'Topics' },
          { id: 'history', icon: HistoryIcon, label: 'History' },
          { id: 'profile', icon: UserIcon, label: 'Profile' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedTopic(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === tab.id ? "text-indigo-600" : "text-gray-400"
            )}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto min-h-screen">
        <header className="p-6 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">
              {activeTab === 'topics' ? 'Practice Center' : activeTab === 'history' ? 'Performance' : 'Your Profile'}
            </h2>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {activeTab === 'topics' ? 'Choose a Topic' : activeTab === 'history' ? 'Practice History' : 'Account Settings'}
            </h1>
          </div>
          
          {activeTab === 'topics' && userData && (
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Band</p>
                <p className="text-lg font-black text-gray-900">{userData.targetBand || 7.0}</p>
              </div>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {selectedTopic ? (
            <SpeakingPractice
              key="practice"
              topic={selectedTopic}
              onBack={() => setSelectedTopic(null)}
            />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'topics' && (
                <TopicList onSelectTopic={setSelectedTopic} />
              )}
              {activeTab === 'history' && (
                <History />
              )}
              {activeTab === 'profile' && (
                <div className="p-6 md:p-12 max-w-2xl">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-6 mb-10">
                      <img
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=6366f1&color=fff`}
                        alt={user.displayName || 'User'}
                        className="w-24 h-24 rounded-3xl shadow-lg border-4 border-white"
                      />
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{user.displayName}</h3>
                        <p className="text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            IELTS Target Score
                          </h4>
                          <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-bold">
                            {userData?.targetBand || 7.0}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="4.0"
                          max="9.0"
                          step="0.5"
                          defaultValue={userData?.targetBand || 7.0}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <span>Band 4.0</span>
                          <span>Band 9.0</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="p-4 bg-white border border-gray-200 rounded-2xl text-left hover:border-indigo-600 transition-colors group">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Language</p>
                          <p className="font-bold text-gray-900 group-hover:text-indigo-600">English (UK)</p>
                        </button>
                        <button className="p-4 bg-white border border-gray-200 rounded-2xl text-left hover:border-indigo-600 transition-colors group">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notifications</p>
                          <p className="font-bold text-gray-900 group-hover:text-indigo-600">Daily Reminders</p>
                        </button>
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-gray-100">
                      <AuthButton />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
