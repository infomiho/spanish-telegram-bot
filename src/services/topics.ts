export interface Topic {
  text: string;
  category: string;
}

interface TriviaQuestion {
  category: string;
  question: string;
  correct_answer: string;
}

interface TriviaResponse {
  response_code: number;
  results: TriviaQuestion[];
}

// Interesting categories from Open Trivia DB
const TRIVIA_CATEGORIES = [
  9,  // General Knowledge
  17, // Science & Nature
  22, // Geography
  23, // History
  25, // Art
  26, // Celebrities
  27, // Animals
  28, // Vehicles
  21, // Sports
  11, // Film
  12, // Music
  14, // Television
];

export async function fetchRandomTopic(): Promise<Topic> {
  const category = TRIVIA_CATEGORIES[Math.floor(Math.random() * TRIVIA_CATEGORIES.length)];

  try {
    const response = await fetch(
      `https://opentdb.com/api.php?amount=1&category=${category}&type=multiple`
    );

    if (!response.ok) {
      return getDefaultTopic();
    }

    const data = (await response.json()) as TriviaResponse;

    if (data.response_code !== 0 || data.results.length === 0) {
      return getDefaultTopic();
    }

    const trivia = data.results[0];
    // Decode HTML entities in the question
    const text = decodeHtmlEntities(trivia.question);

    console.log(`Trivia selected [${trivia.category}]: ${text}`);

    return {
      text,
      category: trivia.category,
    };
  } catch (error) {
    console.error("Failed to fetch trivia:", error);
    return getDefaultTopic();
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&eacute;/g, "é")
    .replace(/&ntilde;/g, "ñ");
}

function getDefaultTopic(): Topic {
  console.log("Using default topic (trivia fetch failed)");
  const defaultTopics = [
    { text: "What's your favorite way to spend a weekend?", category: "Lifestyle" },
    { text: "Describe your dream vacation destination", category: "Travel" },
    { text: "What hobby would you like to learn?", category: "Hobbies" },
    { text: "Tell me about a memorable meal you've had", category: "Food" },
    { text: "What's your favorite season and why?", category: "Nature" },
    { text: "Describe your morning routine", category: "Daily Life" },
    { text: "What movie have you watched recently?", category: "Entertainment" },
    { text: "Tell me about your hometown", category: "Places" },
    { text: "What's the best gift you've ever received?", category: "Personal" },
    { text: "Describe your ideal day off", category: "Lifestyle" },
  ];

  return defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
}
