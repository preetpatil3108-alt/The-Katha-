/**
 * THE KATHA - Level 0 Opening Story Dialogue Data
 *
 * Story Premise:
 * - 5 Village Youths: Ramu + 4 Companions (Varun, Chintu, Bhavani, Dinesh)
 * - Discussion on Vinayaka Chavithi arrangements
 * - Core story beats:
 *   "Chanda collection has reached ₹20,000."
 *   "Let's start the arrangements."
 * - Mushak appears and announces:
 *   "Come on Ramu! We need to collect the leaves from the forest."
 * - Natural Indian village youth tone: energetic, enthusiastic, warm.
 */

import { CharacterId } from '../../types/game';

export interface DialogueLine {
  id: string;
  speakerId: CharacterId;
  speakerName: string;
  role: string;
  text: string;
  gesture: 'none' | 'talk' | 'cheer' | 'explain' | 'wave' | 'nod';
  avatarBg: string;
  tagColor: string;
}

export const LEVEL_1_OPENING_DIALOGUE: DialogueLine[] = [
  {
    id: 'dlg_1',
    speakerId: CharacterId.COMPANION_3,
    speakerName: 'Varun',
    role: 'Youth Treasurer',
    text: 'Friends, look at the register! Chanda collection has reached ₹20,000!',
    gesture: 'cheer',
    avatarBg: '#059669',
    tagColor: 'bg-emerald-600',
  },
  {
    id: 'dlg_2',
    speakerId: CharacterId.COMPANION_1,
    speakerName: 'Chintu',
    role: 'Pandal Incharge',
    text: '₹20,000?! Fantastic! Everyone in Rangastalam showed up for Lord Ganesha!',
    gesture: 'cheer',
    avatarBg: '#ea580c',
    tagColor: 'bg-orange-600',
  },
  {
    id: 'dlg_3',
    speakerId: CharacterId.COMPANION_2,
    speakerName: 'Bhavani',
    role: 'Puja Organizer',
    text: "Let's start the arrangements! The carpenters are putting up the bamboo shamiana right now.",
    gesture: 'explain',
    avatarBg: '#db2777',
    tagColor: 'bg-pink-600',
  },
  {
    id: 'dlg_4',
    speakerId: CharacterId.COMPANION_4,
    speakerName: 'Dinesh',
    role: 'Decorations Lead',
    text: 'The clay idol looks grand! Now we just need the sacred auspicious leaves for the puja.',
    gesture: 'talk',
    avatarBg: '#ca8a04',
    tagColor: 'bg-amber-600',
  },
  {
    id: 'dlg_5',
    speakerId: CharacterId.RAMU,
    speakerName: 'Ramu',
    role: 'Player',
    text: "I'll lead the way. Together, we will bring back everything needed for the Chavithi!",
    gesture: 'nod',
    avatarBg: '#445344',
    tagColor: 'bg-stone-700',
  },
  {
    id: 'dlg_6',
    speakerId: CharacterId.MUSHAK,
    speakerName: 'Mushak',
    role: 'Divine Guide',
    text: 'Come on Ramu! We need to collect the leaves from the forest.',
    gesture: 'wave',
    avatarBg: '#d97706',
    tagColor: 'bg-amber-600',
  },
];

export const LEVEL_0_OPENING_DIALOGUE = LEVEL_1_OPENING_DIALOGUE;
