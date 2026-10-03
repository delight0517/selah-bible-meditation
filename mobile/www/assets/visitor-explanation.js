(() => {
  const button = document.getElementById('visitorExplanationToggle');
  const panel = document.getElementById('visitorExplanation');
  if (!button || !panel) return;
  const copy = {
    ko: {
      hint: '숫자의 뜻 보기', title: '이 숫자는 무엇을 뜻하나요?',
      meaning: n => `지금 표시된 ${n}은 이번 달 셀라를 방문한 서로 다른 익명 브라우저 ID가 ${n}개라는 뜻이에요. 정확히 ${n}명이 방문했다는 뜻은 아니에요.`,
      items: ['같은 기기의 같은 브라우저로 이번 달에 10번 방문해도 1개로 세어요.', '한 사람이 휴대폰과 PC를 사용하거나, 서로 다른 브라우저를 사용하면 각각 집계될 수 있어요. 여러 사람이 같은 브라우저를 쓰면 1개로 잡힐 수 있어요.', '브라우저 저장 데이터를 지우거나 비공개 창을 사용하면 새 ID가 생겨 추가로 집계될 수 있어요.', '새 달이 시작되면 그 달의 방문을 새로 집계해요. 전체 누적 방문자, 회원 수, 지금 접속 중인 사람 수와는 달라요.'],
      period: '기간: UTC 기준 이번 달 1일부터 현재까지. 한국에서는 매월 1일 오전 9시에 새 달 집계가 시작돼요.',
      privacy: '이 숫자는 익명 방문 집계예요. 묵상·기도 내용이나 계정 정보는 방문 집계에 포함하지 않아요.'
    },
    en: {
      hint: 'What does this number mean?', title: 'Understanding this number',
      meaning: n => `${n} means ${n} different anonymous browser IDs visited Selah this month. It does not mean exactly ${n} people.`,
      items: ['Ten visits from the same browser on the same device this month count once.', 'One person using a phone and a computer, or different browsers, may count more than once. People sharing a browser may count once.', 'Clearing browser storage or using private browsing may create a new ID and count again.', 'A new calendar month starts a new count. This is not all-time visitors, registered accounts, or people online now.'],
      period: 'Period: from the first day of this month until now, using UTC.',
      privacy: 'This is an anonymous visit count. Reflection and prayer text and account information are not included in visit statistics.'
    },
    ja: {
      hint: 'この数字の意味', title: 'この数字は何を表しますか？',
      meaning: n => `${n}は、今月Selahを訪れた匿名ブラウザーIDが${n}個あるという意味です。正確な人数ではありません。`,
      items: ['同じ端末の同じブラウザーで今月10回訪れても1回と数えます。', '同じ人がスマートフォンとパソコン、または別のブラウザーを使うと重複する場合があります。ブラウザーを共有する複数人は1つに数えられる場合があります。', '保存データの削除やプライベート閲覧で新しいIDが作られると、追加で数えられる場合があります。', '毎月新しく集計します。累計訪問者、登録者、現在オンラインの人数とは異なります。'],
      period: '期間：UTC基準の今月1日から現在まで。日本では毎月1日午前9時に新しい月の集計が始まります。',
      privacy: '匿名の訪問集計です。黙想・祈りの内容やアカウント情報は訪問統計に含みません。'
    },
    'zh-CN': {
      hint: '了解数字的含义', title: '这个数字是什么意思？',
      meaning: n => `${n}表示本月访问Selah的不同匿名浏览器ID有${n}个，不代表准确的访客人数。`,
      items: ['同一设备的同一浏览器本月访问10次也只计1次。', '一个人使用手机和电脑或不同浏览器可能重复计算。多人共用浏览器可能只计1次。', '清除浏览器数据或使用隐私浏览可能生成新ID并再次计算。', '每个月重新统计。这不是累计访客、注册账户或当前在线人数。'],
      period: '统计时间：按UTC计算，从本月1日至现在。',
      privacy: '这是匿名访问统计，不包含灵修、祷告内容或账户信息。'
    },
    'zh-TW': {
      hint: '了解數字的意思', title: '這個數字代表什麼？',
      meaning: n => `${n}代表本月造訪Selah的不同匿名瀏覽器ID有${n}個，不代表準確的訪客人數。`,
      items: ['同一裝置的同一瀏覽器本月造訪10次也只計1次。', '同一人使用手機和電腦或不同瀏覽器可能重複計算。多人共用瀏覽器可能只計1次。', '清除瀏覽器資料或使用私密瀏覽可能產生新ID並再次計算。', '每個月重新統計。這不是累計訪客、註冊帳戶或目前在線人數。'],
      period: '統計期間：依UTC計算，從本月1日至現在。',
      privacy: '這是匿名造訪統計，不包含靈修、禱告內容或帳戶資料。'
    }
  };
  function render(total, locale) {
    const text = copy[locale] || copy.en;
    document.getElementById('visitorExplanationHint').textContent = text.hint;
    const title = document.createElement('h3');
    title.textContent = text.title;
    const meaning = document.createElement('p');
    meaning.textContent = text.meaning(Number(total).toLocaleString(locale));
    const list = document.createElement('ul');
    for (const item of text.items) {
      const row = document.createElement('li'); row.textContent = item; list.append(row);
    }
    const period = document.createElement('p'); period.textContent = text.period;
    const privacy = document.createElement('p'); privacy.textContent = text.privacy;
    panel.replaceChildren(title, meaning, list, period, privacy);
  }
  button.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });
  window.SelahVisitorExplanation = { render };
})();
