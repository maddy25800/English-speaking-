import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw, CheckCircle, AlertCircle, ChevronLeft, Send, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeSpeaking, IELTSFeedback } from '../services/gemini';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './Auth';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SpeakingPracticeProps {
  topic: {
    id: string;
    title: string;
    part: number;
    questions: string[];
  };
  onBack: () => void;
}

export const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ topic, onBack }) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<IELTSFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAnalyze = async () => {
    if (!audioBlob || !user) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const result = await analyzeSpeaking(base64Audio, topic.title);
        setFeedback(result);

        // Save to Firestore
        await addDoc(collection(db, 'attempts'), {
          userId: user.uid,
          topicId: topic.id,
          topicTitle: topic.title,
          transcript: result.transcript,
          scores: {
            fluency: result.fluency,
            grammar: result.grammar,
            vocabulary: result.vocabulary,
            overall: result.overall,
          },
          feedback: result.feedback,
          createdAt: serverTimestamp(),
        });

        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze speaking. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 group"
      >
        <ChevronLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
        Back to Topics
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 bg-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-bold bg-white/20 rounded-full backdrop-blur-sm">
              Part {topic.part}
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-4">{topic.title}</h2>
          <div className="space-y-4">
            <p className="text-indigo-100 font-medium">Try to answer these questions:</p>
            <ul className="space-y-2">
              {topic.questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-indigo-50">
                  <span className="text-indigo-300 font-bold">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!feedback ? (
              <motion.div
                key="recording-ui"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12"
              >
                {isRecording ? (
                  <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-red-100 rounded-full"
                      />
                      <div className="relative z-10 w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                        <Square className="w-8 h-8 text-white fill-current" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-mono font-bold text-gray-900 mb-2">
                        {formatTime(recordingTime)}
                      </p>
                      <p className="text-red-500 font-medium animate-pulse">Recording...</p>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg"
                    >
                      Stop Recording
                    </button>
                  </div>
                ) : audioUrl ? (
                  <div className="flex flex-col items-center gap-8 w-full max-w-md">
                    <div className="w-full p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <audio src={audioUrl} controls className="w-full" />
                    </div>
                    <div className="flex gap-4 w-full">
                      <button
                        onClick={() => {
                          setAudioUrl(null);
                          setAudioBlob(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Retake
                      </button>
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Get Feedback
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center group cursor-pointer hover:bg-indigo-100 transition-colors" onClick={startRecording}>
                      <Mic className="w-10 h-10 text-indigo-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to practice?</h3>
                      <p className="text-gray-500">Tap the microphone to start recording your response.</p>
                    </div>
                    <button
                      onClick={startRecording}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                      Start Recording
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="feedback-ui"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Overall', score: feedback.overall, color: 'indigo' },
                    { label: 'Fluency', score: feedback.fluency, color: 'emerald' },
                    { label: 'Grammar', score: feedback.grammar, color: 'amber' },
                    { label: 'Vocabulary', score: feedback.vocabulary, color: 'rose' },
                  ].map((stat) => (
                    <div key={stat.label} className={cn(
                      "p-4 rounded-2xl border text-center",
                      stat.color === 'indigo' ? "bg-indigo-50 border-indigo-100" :
                      stat.color === 'emerald' ? "bg-emerald-50 border-emerald-100" :
                      stat.color === 'amber' ? "bg-amber-50 border-amber-100" :
                      "bg-rose-50 border-rose-100"
                    )}>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
                      <p className={cn(
                        "text-3xl font-black",
                        stat.color === 'indigo' ? "text-indigo-600" :
                        stat.color === 'emerald' ? "text-emerald-600" :
                        stat.color === 'amber' ? "text-amber-600" :
                        "text-rose-600"
                      )}>{stat.score.toFixed(1)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      Transcript
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-2xl text-gray-700 italic leading-relaxed border border-gray-100">
                      "{feedback.transcript}"
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      AI Feedback
                    </h3>
                    <div className="prose prose-indigo max-w-none text-gray-600 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <ReactMarkdown>{feedback.feedback}</ReactMarkdown>
                    </div>
                  </section>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      setFeedback(null);
                      setAudioUrl(null);
                      setAudioBlob(null);
                    }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    Practice Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
