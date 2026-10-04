(() => {
  'use strict';

  const palette = {
    yellow: '#ffe58a', green: '#bde8bc', blue: '#c5e3ff', pink: '#ffd2df',
    purple: '#dfd2ff', orange: '#ffd7aa'
  };
  const labels = {
    ko: { ask: '질문', group: '내 색으로 말씀 표시', question: '선택한 말씀 묵상 질문', clear: '선택 구절 표시 지우기',
      saved: '선택한 말씀을 내 색으로 표시했어요.', removed: '선택한 말씀의 표시를 지웠어요.', none: '이 구절에는 지울 표시가 없어요.',
      colors: { yellow: '노랑', green: '초록', blue: '파랑', pink: '분홍', purple: '보라', orange: '주황' } },
    en: { ask: 'Ask', group: 'Highlight in my color', question: 'Ask about selected Scripture', clear: 'Clear highlight from selection',
      saved: 'Scripture highlighted in your color.', removed: 'Highlight removed from selection.', none: 'There is no highlight to remove here.',
      colors: { yellow: 'Yellow', green: 'Green', blue: 'Blue', pink: 'Pink', purple: 'Purple', orange: 'Orange' } },
    ja: { ask: '質問', group: '自分の色で聖書をハイライト', question: '選択した聖書箇所について質問', clear: '選択範囲のハイライトを削除',
      saved: '選択した聖書箇所を自分の色で表示しました。', removed: '選択範囲のハイライトを削除しました。', none: 'この範囲に削除できるハイライトはありません。',
      colors: { yellow: '黄色', green: '緑', blue: '青', pink: 'ピンク', purple: '紫', orange: 'オレンジ' } },
    'zh-CN': { ask: '提问', group: '用自己的颜色标记经文', question: '询问所选经文', clear: '清除所选经文标记',
      saved: '已用你的颜色标记经文。', removed: '已清除所选经文标记。', none: '此处没有可清除的标记。',
      colors: { yellow: '黄色', green: '绿色', blue: '蓝色', pink: '粉色', purple: '紫色', orange: '橙色' } },
    'zh-TW': { ask: '提問', group: '用自己的顏色標記經文', question: '詢問所選經文', clear: '清除所選經文標記',
      saved: '已用你的顏色標記經文。', removed: '已清除所選經文標記。', none: '此處沒有可清除的標記。',
      colors: { yellow: '黃色', green: '綠色', blue: '藍色', pink: '粉紅', purple: '紫色', orange: '橘色' } },
    es: { ask: 'Preguntar', group: 'Resaltar con mi color', question: 'Preguntar sobre el pasaje seleccionado', clear: 'Quitar resaltado de la selección',
      saved: 'Pasaje resaltado con tu color.', removed: 'Se quitó el resaltado de la selección.', none: 'No hay resaltado que quitar aquí.',
      colors: { yellow: 'Amarillo', green: 'Verde', blue: 'Azul', pink: 'Rosa', purple: 'Morado', orange: 'Naranja' } },
    'pt-br': { ask: 'Perguntar', group: 'Destacar com minha cor', question: 'Perguntar sobre o trecho selecionado', clear: 'Remover destaque da seleção',
      saved: 'Trecho destacado com sua cor.', removed: 'Destaque removido da seleção.', none: 'Não há destaque para remover aqui.',
      colors: { yellow: 'Amarelo', green: 'Verde', blue: 'Azul', pink: 'Rosa', purple: 'Roxo', orange: 'Laranja' } },
    fil: { ask: 'Tanong', group: 'I-highlight gamit ang sarili kong kulay', question: 'Itanong ang napiling talata', clear: 'Alisin ang highlight sa napili',
      saved: 'Na-highlight ang talata gamit ang kulay mo.', removed: 'Inalis ang highlight sa napili.', none: 'Walang highlight na maaalis dito.',
      colors: { yellow: 'Dilaw', green: 'Berde', blue: 'Asul', pink: 'Rosas', purple: 'Lila', orange: 'Kahel' } }
  };
  const copy = locale => labels[locale] || labels.en;
  const valid = mark => mark && mark.kind === 'highlight' && palette[mark.color || 'yellow'];
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function render(text, marks = []) {
    const value = String(text || ''), ranges = marks.filter(valid).map(mark => ({
      start: Number.isInteger(mark.start) ? Math.max(0, Math.min(value.length, mark.start)) : 0,
      end: Number.isInteger(mark.end) ? Math.max(0, Math.min(value.length, mark.end)) : value.length,
      color: mark.color || 'yellow', updatedAt: Number(mark.updatedAt) || 0
    })).filter(mark => mark.end > mark.start);
    const boundaries = [...new Set([0, value.length, ...ranges.flatMap(mark => [mark.start, mark.end])])].sort((a, b) => a - b);
    const parts = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i], end = boundaries[i + 1];
      const mark = ranges.filter(item => item.start <= start && item.end >= end).sort((a, b) => a.updatedAt - b.updatedAt).at(-1);
      const color = mark?.color || '', text = value.slice(start, end), last = parts.at(-1);
      if (last?.color === color) last.text += text;
      else parts.push({ color, text });
    }
    return parts.map(part => { const text = escape(part.text); return part.color ? `<mark class="scripture-highlight scripture-highlight--${part.color}">${text}</mark>` : text; }).join('');
  }

  function replaceSelection(records, segments, locale, color, now = Date.now()) {
    const remaining = [...records];
    for (const segment of segments) {
      const changed = [];
      for (const mark of remaining) {
        if (mark.kind !== 'highlight' || mark.ref !== segment.ref || mark.locale !== locale) { changed.push(mark); continue; }
        const start = Number.isInteger(mark.start) ? mark.start : 0;
        const end = Number.isInteger(mark.end) ? mark.end : segment.verseLength;
        if (end <= segment.start || start >= segment.end) { changed.push(mark); continue; }
        if (start < segment.start) changed.push({ ...mark, id: `highlight:${mark.ref}:${start}:${segment.start}`, start, end: segment.start, updatedAt: now });
        if (end > segment.end) changed.push({ ...mark, id: `highlight:${mark.ref}:${segment.end}:${end}`, start: segment.end, end, updatedAt: now });
      }
      remaining.splice(0, remaining.length, ...changed);
      if (color) remaining.push({ id: `highlight:${segment.ref}:${segment.start}:${segment.end}`, ref: segment.ref,
        kind: 'highlight', locale, color, start: segment.start, end: segment.end, createdAt: now, updatedAt: now });
    }
    return remaining;
  }

  function hasSelection(records, segments, locale) {
    return segments.some(segment => records.some(mark => mark.kind === 'highlight' && mark.locale === locale && mark.ref === segment.ref &&
      (Number.isInteger(mark.end) ? mark.end : segment.verseLength) > segment.start && (Number.isInteger(mark.start) ? mark.start : 0) < segment.end));
  }

  window.SelahScriptureHighlights = { palette, copy, render, replaceSelection, hasSelection };
})();
