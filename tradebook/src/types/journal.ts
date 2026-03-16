export type JournalMood = 'great' | 'good' | 'neutral' | 'frustrated' | 'tilted';
export type JournalGrade = 'A' | 'B' | 'C' | 'D';

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  premarket_plan: string;
  postmarket_review: string;
  lessons: string;
  mood: JournalMood | null;
  grade: JournalGrade | null;
  goals_for_tomorrow: string;
  created_at: string;
  updated_at: string;
}

export type JournalEntryInsert = Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
