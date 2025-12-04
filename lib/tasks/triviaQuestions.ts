export type TriviaCategory = 'Science' | 'History' | 'Geography' | 'Entertainment' | 'Sports' | 'Technology' | 'General';

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer (0-based)
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Geography
  {
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 1,
    category: 'Entertainment',
    difficulty: 'easy',
  },
  {
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 3,
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    category: 'Science',
    difficulty: 'medium',
  },
  {
    question: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    question: 'What is the smallest prime number?',
    options: ['0', '1', '2', '3'],
    correctAnswer: 2,
    category: 'General',
    difficulty: 'medium',
  },
  {
    question: 'Which animal is known as the King of the Jungle?',
    options: ['Tiger', 'Lion', 'Elephant', 'Bear'],
    correctAnswer: 1,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'What is the speed of light in vacuum (approximately)?',
    options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'],
    correctAnswer: 0,
    category: 'Science',
    difficulty: 'hard',
  },
  {
    question: 'What is the largest mammal in the world?',
    options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: 2,
    category: 'History',
    difficulty: 'medium',
  },
  {
    question: 'What is the square root of 64?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'Which gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correctAnswer: 2,
    category: 'Science',
    difficulty: 'medium',
  },
  {
    question: 'What is the hardest natural substance on Earth?',
    options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
    correctAnswer: 2,
    category: 'Science',
    difficulty: 'medium',
  },
  {
    question: 'How many sides does a hexagon have?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 2,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'What is the longest river in the world?',
    options: ['Amazon River', 'Nile River', 'Mississippi River', 'Yangtze River'],
    correctAnswer: 1,
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    question: 'What is the capital of Japan?',
    options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
    correctAnswer: 2,
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    question: 'What is 10 × 5?',
    options: ['40', '50', '60', '70'],
    correctAnswer: 1,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'Which element has the chemical symbol "O"?',
    options: ['Osmium', 'Oxygen', 'Oganesson', 'Osmium'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'What is the largest planet in our solar system?',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'How many minutes are in an hour?',
    options: ['50', '60', '70', '80'],
    correctAnswer: 1,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 2,
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    question: 'What is the freezing point of water in Celsius?',
    options: ['-10°C', '0°C', '10°C', '20°C'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'Which country is home to the kangaroo?',
    options: ['New Zealand', 'Australia', 'South Africa', 'Brazil'],
    correctAnswer: 1,
    category: 'Geography',
    difficulty: 'easy',
  },
  // More Geography Questions
  {
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correctAnswer: 1,
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    question: 'Which country has the most time zones?',
    options: ['Russia', 'United States', 'France', 'China'],
    correctAnswer: 0,
    category: 'Geography',
    difficulty: 'hard',
  },
  {
    question: 'What is the capital of Brazil?',
    options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Buenos Aires'],
    correctAnswer: 2,
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    question: 'Which mountain is the tallest in the world?',
    options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Lhotse'],
    correctAnswer: 1,
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    question: 'What is the largest desert in the world?',
    options: ['Gobi Desert', 'Sahara Desert', 'Antarctic Desert', 'Arabian Desert'],
    correctAnswer: 2,
    category: 'Geography',
    difficulty: 'hard',
  },
  // More Science Questions
  {
    question: 'What is the most abundant gas in Earth\'s atmosphere?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
    correctAnswer: 2,
    category: 'Science',
    difficulty: 'medium',
  },
  {
    question: 'How many bones are in an adult human body?',
    options: ['196', '206', '216', '226'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'medium',
  },
  {
    question: 'What is the chemical symbol for water?',
    options: ['H2O', 'CO2', 'NaCl', 'O2'],
    correctAnswer: 0,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Mercury', 'Earth', 'Mars'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'What is the speed of sound in air (approximately)?',
    options: ['300 m/s', '330 m/s', '360 m/s', '390 m/s'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'hard',
  },
  {
    question: 'How many chambers does a human heart have?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 2,
    category: 'Science',
    difficulty: 'medium',
  },
  {
    question: 'What is the atomic number of carbon?',
    options: ['4', '6', '8', '12'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'hard',
  },
  // History Questions
  {
    question: 'In which year did the Berlin Wall fall?',
    options: ['1987', '1989', '1991', '1993'],
    correctAnswer: 1,
    category: 'History',
    difficulty: 'medium',
  },
  {
    question: 'Who was the first person to walk on the moon?',
    options: ['Buzz Aldrin', 'Neil Armstrong', 'Michael Collins', 'John Glenn'],
    correctAnswer: 1,
    category: 'History',
    difficulty: 'easy',
  },
  {
    question: 'In which year did World War I begin?',
    options: ['1912', '1914', '1916', '1918'],
    correctAnswer: 1,
    category: 'History',
    difficulty: 'medium',
  },
  {
    question: 'Which ancient civilization built the pyramids?',
    options: ['Greeks', 'Romans', 'Egyptians', 'Mayans'],
    correctAnswer: 2,
    category: 'History',
    difficulty: 'easy',
  },
  {
    question: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Picasso', 'Van Gogh'],
    correctAnswer: 1,
    category: 'History',
    difficulty: 'easy',
  },
  {
    question: 'In which year did the Titanic sink?',
    options: ['1910', '1912', '1914', '1916'],
    correctAnswer: 1,
    category: 'History',
    difficulty: 'medium',
  },
  // Entertainment Questions
  {
    question: 'Which movie won the Academy Award for Best Picture in 2020?',
    options: ['Parasite', '1917', 'Joker', 'Once Upon a Time in Hollywood'],
    correctAnswer: 0,
    category: 'Entertainment',
    difficulty: 'medium',
  },
  {
    question: 'Who wrote "1984"?',
    options: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'J.D. Salinger'],
    correctAnswer: 0,
    category: 'Entertainment',
    difficulty: 'medium',
  },
  {
    question: 'Which band sang "Bohemian Rhapsody"?',
    options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'],
    correctAnswer: 1,
    category: 'Entertainment',
    difficulty: 'easy',
  },
  {
    question: 'How many Harry Potter books are there?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    category: 'Entertainment',
    difficulty: 'easy',
  },
  {
    question: 'Which streaming service created "Stranger Things"?',
    options: ['Hulu', 'Netflix', 'Amazon Prime', 'Disney+'],
    correctAnswer: 1,
    category: 'Entertainment',
    difficulty: 'easy',
  },
  // Sports Questions
  {
    question: 'How many players are on a basketball team on the court at once?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    category: 'Sports',
    difficulty: 'easy',
  },
  {
    question: 'Which country won the FIFA World Cup in 2018?',
    options: ['Brazil', 'Germany', 'France', 'Argentina'],
    correctAnswer: 2,
    category: 'Sports',
    difficulty: 'medium',
  },
  {
    question: 'How many rings are in the Olympic symbol?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    category: 'Sports',
    difficulty: 'easy',
  },
  {
    question: 'In which sport is the term "ace" used?',
    options: ['Tennis', 'Golf', 'Baseball', 'Basketball'],
    correctAnswer: 0,
    category: 'Sports',
    difficulty: 'easy',
  },
  // Technology Questions
  {
    question: 'What does "CPU" stand for?',
    options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Utility'],
    correctAnswer: 0,
    category: 'Technology',
    difficulty: 'easy',
  },
  {
    question: 'Which company created the iPhone?',
    options: ['Samsung', 'Apple', 'Google', 'Microsoft'],
    correctAnswer: 1,
    category: 'Technology',
    difficulty: 'easy',
  },
  {
    question: 'What does "HTML" stand for?',
    options: ['HyperText Markup Language', 'High Tech Modern Language', 'HyperText Modern Language', 'High Tech Markup Language'],
    correctAnswer: 0,
    category: 'Technology',
    difficulty: 'medium',
  },
  {
    question: 'Which year was the first iPhone released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    category: 'Technology',
    difficulty: 'hard',
  },
  // More General Questions
  {
    question: 'How many days are in a leap year?',
    options: ['364', '365', '366', '367'],
    correctAnswer: 2,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'What is the square root of 144?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    category: 'General',
    difficulty: 'medium',
  },
  {
    question: 'How many letters are in the English alphabet?',
    options: ['24', '25', '26', '27'],
    correctAnswer: 2,
    category: 'General',
    difficulty: 'easy',
  },
  {
    question: 'What is 15% of 200?',
    options: ['25', '30', '35', '40'],
    correctAnswer: 1,
    category: 'General',
    difficulty: 'medium',
  },
];

export function getRandomQuestions(count: number, category?: TriviaCategory, difficulty?: 'easy' | 'medium' | 'hard'): TriviaQuestion[] {
  let filtered = [...TRIVIA_QUESTIONS];
  
  if (category) {
    filtered = filtered.filter(q => q.category === category);
  }
  
  if (difficulty) {
    filtered = filtered.filter(q => q.difficulty === difficulty);
  }
  
  // If filtered list is too small, fall back to all questions
  if (filtered.length < count) {
    filtered = [...TRIVIA_QUESTIONS];
  }
  
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getQuestionsByCategory(category: TriviaCategory): TriviaQuestion[] {
  return TRIVIA_QUESTIONS.filter(q => q.category === category);
}

export function getQuestionCount(): number {
  return TRIVIA_QUESTIONS.length;
}

export function getCategoryCounts(): Record<TriviaCategory, number> {
  const counts: Record<TriviaCategory, number> = {
    Science: 0,
    History: 0,
    Geography: 0,
    Entertainment: 0,
    Sports: 0,
    Technology: 0,
    General: 0,
  };
  
  TRIVIA_QUESTIONS.forEach(q => {
    counts[q.category]++;
  });
  
  return counts;
}

