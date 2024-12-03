const common = {
  language: [
    "English",
    "Mandarin Chinese",
    "Hindi",
    "Spanish",
    "French",
    "Arabic",
    "Bengali",
    "Russian",
    "Portuguese",
    "Urdu",
    "Indonesian",
    "German",
    "Japanese",
    "Swahili",
    "Marathi",
    "Telugu",
    "Turkish",
    "Tamil",
    "Korean",
    "Vietnamese",
  ],
  pos: [
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
    "article",
    "determiner",
    "numeral",
    "particle",
    "auxiliary verb",
    "modal verb",
    "gerund",
    "infinitive",
    "clause",
    "other",
  ],
};

export const word_db = {
  version: 0.1,
  name: "word_db",
  title: "Multilingual Vocabulary Database",
  description:
    "A schema for storing and organizing multilingual vocabulary words with associated metadata.",
  settings: {
    primary_keys: ["word", "language"],
    encrypted_fields: [],
    non_editable_fields: [],
  },
  schema: {
    type: "object",
    properties: {
      word: {
        type: "string",
        description: "The word or phrase to learn.",
      },
      language: {
        type: "string",
        description:
          "The language of the word or phrase (e.g., English, Spanish, French).",
        enum: common.language,
      },
      meaning_english: {
        type: "string",
        description: "The meaning of the word in English.",
      },
      translation: {
        type: "object",
        description: "The translations of the word into other languages.",
        additionalProperties: {
          type: "string",
          description:
            "A language code as the key and the translated word as the value.",
        },
      },
      partOfSpeech: {
        type: "string",
        description:
          "The grammatical category of the word (e.g., noun, verb, adjective).",
        enum: common.pos,
      },
      pronunciation: {
        type: "string",
        description:
          "The pronunciation of the word, often written in phonetic symbols.",
      },
      gender: {
        type: "string",
        description:
          "The grammatical gender of the word (if applicable, e.g., masculine, feminine).",
        enum: ["masculine", "feminine", "neuter", null],
      },
      pluralForm: {
        type: "string",
        description: "The plural form of the word (if applicable).",
      },
      usageExamples: {
        type: "array",
        description: "Sample sentences demonstrating the word's usage.",
        items: {
          type: "string",
        },
      },
      synonyms: {
        type: "array",
        description: "A list of words with similar meanings.",
        items: {
          type: "string",
        },
      },
      antonyms: {
        type: "array",
        description: "A list of words with opposite meanings.",
        items: {
          type: "string",
        },
      },
      etymology: {
        type: "string",
        description: "The word's origin or history.",
      },
      category: {
        type: "string",
        description:
          "The topic or category the word belongs to (e.g., food, travel, emotions).",
      },
      frequency: {
        type: "string",
        description: "How commonly the word is used in daily language.",
        enum: ["common", "rare", "formal", null],
      },
      audioLink: {
        type: "string",
        description: "A link to an audio file or tool for pronunciation.",
        format: "uri",
      },
      mnemonics: {
        type: "string",
        description: "A memory aid or technique to help remember the word.",
      },
      customNotes: {
        type: "string",
        description: "Personalized notes or observations about the word.",
      },
      difficultyLevel: {
        type: "string",
        description: "The perceived difficulty of the word.",
        enum: ["easy", "medium", "hard", null],
      },
      learningStatus: {
        type: "string",
        description: "Your progress with this word.",
        enum: ["learning", "mastered", "in-progress", null],
      },
      image: {
        type: "string",
        description: "A link to an image representing the word.",
        format: "uri",
      },
      references: {
        type: "array",
        description: "Links or sources where you encountered the word.",
        items: {
          type: "string",
          format: "uri",
        },
      },
    },
    required: ["word", "language"],
  },
};

export const phrase_wd = {
  version: 0.1,
  name: "phrase_db",
  title: "Clauses, Phrases, and Idioms Database",
  description:
    "A schema for storing linguistic expressions such as clauses, phrases, and idioms with their metadata.",
  settings: {
    primary_keys: ["expression", "language"],
    encrypted_fields: [],
    non_editable_fields: [],
  },
  schema: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "The clause, phrase, or idiom.",
      },
      language: {
        type: "string",
        description:
          "The language of the expression (e.g., English, Spanish, French).",
        enum: common.language,
      },
      literal_meaning: {
        type: "string",
        description:
          "The literal translation of the expression, useful for idioms.",
      },
      usage_examples: {
        type: "array",
        description:
          "Example sentences demonstrating how to use the expression.",
        items: {
          type: "string",
        },
      },
      
      related_terms: {
        type: "array",
        description: "Other expressions related to this one.",
        items: {
          type: "string",
        },
      },
      category: {
        type: "string",
        description:
          "Thematic category of the expression (e.g., emotions, business, travel).",
      },
      audio_link: {
        type: "string",
        description: "A link to an audio file for pronunciation, if available.",
        format: "uri",
      },
      image: {
        type: "string",
        description:
          "A link to an image representing the expression, if available.",
        format: "uri",
      },
      etymology: {
        type: "string",
        description: "The origin or historical background of the expression.",
      },
      notes: {
        type: "string",
        description: "Custom notes or observations about the expression.",
      },
    },
    required: ["expression","language"],
  },
};
