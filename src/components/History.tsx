import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './Auth';
import { Calendar, Clock, Star, ChevronRight, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface Attempt {
  id: string;
  topicTitle: string;
  transcript: string;
  scores: {
    fluency: number;
    grammar: number;
    vocabulary: number;
    overall: number;
  };
  feedback: string;
  createdAt: any;
}

export const History: React.FC = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attemptData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attempt));
      setAttempts(attemptData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching history:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No attempts yet</h3>
        <p className="text-gray-500 max-w-xs mx-auto">Start practicing with topics to see your progress history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold">
          <Star className="w-4 h-4 fill-current" />
          {attempts.length} Practices
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {attempts.map((attempt, index) => (
          <motion.div
            key={attempt.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {attempt.topicTitle}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-full">
                    Band {attempt.scores.overall.toFixed(1)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {attempt.createdAt?.toDate().toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {attempt.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 italic">
                  "{attempt.transcript}"
                </p>
              </div>

              <div className="flex items-center gap-2 md:border-l md:pl-6 border-gray-100">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'F', score: attempt.scores.fluency },
                    { label: 'G', score: attempt.scores.grammar },
                    { label: 'V', score: attempt.scores.vocabulary },
                  ].map((s) => (
                    <div key={s.label} className="w-10 h-10 rounded-lg bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 leading-none mb-1">{s.label}</span>
                      <span className="text-xs font-black text-gray-700 leading-none">{s.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all ml-2" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
