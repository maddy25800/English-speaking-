import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Topic {
  id: string;
  title: string;
  description: string;
  part: number;
  questions: string[];
}

const DEFAULT_TOPICS: Topic[] = [
  {
    id: '1',
    title: 'Hometown',
    description: 'Talk about where you grew up.',
    part: 1,
    questions: ['Where is your hometown?', 'What do you like about it?', 'Has it changed much since you were a child?']
  },
  {
    id: '2',
    title: 'A Memorable Journey',
    description: 'Describe a trip you took that you still remember.',
    part: 2,
    questions: ['Where did you go?', 'Who did you go with?', 'What happened on the trip?', 'Why was it memorable?']
  },
  {
    id: '3',
    title: 'Technology in Education',
    description: 'Discuss the impact of technology on learning.',
    part: 3,
    questions: ['How has technology changed the way people learn?', 'Do you think teachers will ever be replaced by AI?', 'What are the drawbacks of using too much technology in schools?']
  }
];

interface TopicListProps {
  onSelectTopic: (topic: Topic) => void;
}

export const TopicList: React.FC<TopicListProps> = ({ onSelectTopic }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'topics'), orderBy('part', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topicData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
      if (topicData.length === 0) {
        setTopics(DEFAULT_TOPICS);
      } else {
        setTopics(topicData);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching topics:', error);
      setTopics(DEFAULT_TOPICS);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {topics.map((topic, index) => (
        <motion.div
          key={topic.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectTopic(topic)}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="w-16 h-16 text-indigo-600" />
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full">
              Part {topic.part}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
            {topic.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {topic.description}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs font-medium text-gray-500">Practice now</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
