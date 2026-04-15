export interface Phrase {
  id: string;
  text: string;
  category: string;
}

export interface PhraseCategory {
  id: string;
  name: string;
  icon: string;
  phrases: Phrase[];
}

export const phraseBook: PhraseCategory[] = [
  {
    id: 'greetings',
    name: 'Greetings',
    icon: '👋',
    phrases: [
      { id: 'g1', text: 'Hello', category: 'greetings' },
      { id: 'g2', text: 'Good morning', category: 'greetings' },
      { id: 'g3', text: 'Good afternoon', category: 'greetings' },
      { id: 'g4', text: 'Good evening', category: 'greetings' },
      { id: 'g5', text: 'How are you?', category: 'greetings' },
      { id: 'g6', text: 'Nice to meet you', category: 'greetings' },
      { id: 'g7', text: 'Goodbye', category: 'greetings' },
      { id: 'g8', text: 'See you later', category: 'greetings' },
    ],
  },
  {
    id: 'emergencies',
    name: 'Emergencies',
    icon: '🚨',
    phrases: [
      { id: 'e1', text: 'Help!', category: 'emergencies' },
      { id: 'e2', text: 'Call 911', category: 'emergencies' },
      { id: 'e3', text: 'I need a doctor', category: 'emergencies' },
      { id: 'e4', text: 'I am hurt', category: 'emergencies' },
      { id: 'e5', text: 'Where is the hospital?', category: 'emergencies' },
      { id: 'e6', text: 'I need help', category: 'emergencies' },
    ],
  },
  {
    id: 'daily',
    name: 'Daily Use',
    icon: '💬',
    phrases: [
      { id: 'd1', text: 'Thank you', category: 'daily' },
      { id: 'd2', text: 'Please', category: 'daily' },
      { id: 'd3', text: 'Excuse me', category: 'daily' },
      { id: 'd4', text: 'I am sorry', category: 'daily' },
      { id: 'd5', text: 'Yes', category: 'daily' },
      { id: 'd6', text: 'No', category: 'daily' },
      { id: 'd7', text: 'Where is the bathroom?', category: 'daily' },
      { id: 'd8', text: 'How much does this cost?', category: 'daily' },
      { id: 'd9', text: 'I do not understand', category: 'daily' },
      { id: 'd10', text: 'Can you help me?', category: 'daily' },
    ],
  },
  {
    id: 'classroom',
    name: 'Classroom',
    icon: '📚',
    phrases: [
      { id: 'c1', text: 'What does this mean?', category: 'classroom' },
      { id: 'c2', text: 'Can you repeat that?', category: 'classroom' },
      { id: 'c3', text: 'I have a question', category: 'classroom' },
      { id: 'c4', text: 'I understand', category: 'classroom' },
      { id: 'c5', text: 'Can you explain again?', category: 'classroom' },
      { id: 'c6', text: 'What is the homework?', category: 'classroom' },
      { id: 'c7', text: 'May I go to the restroom?', category: 'classroom' },
    ],
  },
  {
    id: 'feelings',
    name: 'Feelings',
    icon: '❤️',
    phrases: [
      { id: 'f1', text: 'I am happy', category: 'feelings' },
      { id: 'f2', text: 'I am sad', category: 'feelings' },
      { id: 'f3', text: 'I am tired', category: 'feelings' },
      { id: 'f4', text: 'I am hungry', category: 'feelings' },
      { id: 'f5', text: 'I am scared', category: 'feelings' },
      { id: 'f6', text: 'I love you', category: 'feelings' },
    ],
  },
];
