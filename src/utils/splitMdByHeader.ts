export interface RawNote {
  title: string;
  content: string;
}

/**
 * Markdownテキストを見出し（# または ## など）で分割し、タイトルと本文のペアのリストを返します。
 * 見出しがない場合は、テキスト全体を1つのセクションとして扱います。
 */
export function splitMdByHeader(text: string, defaultTitle: string = 'No Title'): RawNote[] {
  if (!text.trim()) return [];

  const lines = text.split('\n');
  const sections: RawNote[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];

  // 見出し（# から ###### まで）にマッチする正規表現
  const headerRegex = /^(#{1,6})\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(headerRegex);
    if (match) {
      // 前のセクションを保存（タイトルまたは内容がある場合）
      if (currentTitle || currentContent.length > 0) {
        sections.push({
          title: currentTitle || defaultTitle,
          content: currentContent.join('\n').trim(),
        });
      }
      // 新しいセクションを開始
      currentTitle = match[2].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // 最後のセクションを保存
  if (currentTitle || currentContent.length > 0) {
    sections.push({
      title: currentTitle || defaultTitle,
      content: currentContent.join('\n').trim(),
    });
  }

  return sections;
}
