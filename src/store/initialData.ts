import { type Note } from "../types"

export const INITIAL_NOTE: Note[] = [
  { id: '1', profile_id: '', title: '散歩', category: 'health', status: 'can', content: 'AM11:00に毎日の習慣として', x: 10, y: 10 },
  { id: '2', profile_id: '', title: '火の管理', category: 'house', status: 'risk', content: 'コンロの消し忘れに注意', x: 10, y: 60 },
  { id: '3', profile_id: '', title: '買い物', category: 'food', status: 'can', content: '# 今日の様子\n足取りは軽いが、**段差**に注意が必要。', x: 35, y: 20 },
]

export const INITIAL_PENDING_NOTES: Note[] = [
  {
    id: 'p1',
    profile_id: '',
    title: 'デイサービス体験の感想',
    category: 'social',
    status: 'pending',
    content: '昨日のデイサービス、とても楽しかった様子。スタッフの方との会話が弾んでいたとのこと。\n\n---\n**今後の予定**\n週2回程度の利用を検討したい。',
    x: 0,
    y: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p2',
    profile_id: '',
    title: '服薬管理の相談',
    category: 'medical',
    status: 'pending',
    content: '朝の薬、たまに飲み忘れることがあるらしい。お薬カレンダーの導入を検討。',
    x: 0,
    y: 0,
    updatedAt: new Date().toISOString()
  }
]
