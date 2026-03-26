import { type Note } from "../types"

export const INITIAL_NOTE: Note[] = [
  { id: '1', title: '散歩', category: 'health', status: 'can', content: 'AM11:00に毎日の習慣として', x: 50, y: 50 },
  { id: '2', title: '火の不始末', category: 'house', status: 'risk', content: 'コンロの消し忘れに注意', x: 300, y: 300 },
  { id: '3', title: '買い物', category: 'food', status: 'can', content: '# 今日の様子\n足取りは軽いが、**段差**に注意が必要。', x: 400, y: 150 },
]
