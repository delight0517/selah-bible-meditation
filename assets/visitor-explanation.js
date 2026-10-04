(() => {
  const button = document.getElementById('visitorExplanationToggle');
  const panel = document.getElementById('visitorExplanation');
  if (!button || !panel) return;
  const copy = {
    ko: {hint:'숫자의 뜻 보기',title:'오늘 수치는 무엇을 뜻하나요?',meaning:n=>n==null?'새 하루 집계 자료가 아직 준비되지 않았어요.':'오늘 셀라를 연 익명 브라우저 ID '+n+'개를 뜻해요. 실제 사람 수와 정확히 같지는 않아요.',items:['같은 브라우저에서 오늘 여러 번 열어도 한 번만 세어요.','다른 기기·브라우저, 비공개 창, 저장 데이터 초기화는 별도로 셀 수 있어요.','로그인하지 않아도 집계되며, 계정 기준으로 사람을 식별하지 않아요.','다음 UTC 자정에 새로 시작해요. 한국 시간으로는 오전 9시예요.'],period:'기간: UTC 오늘 00:00부터 현재까지.',privacy:'묵상·기도 내용, 성경 구절, 계정 정보는 방문 통계에 포함하지 않아요.'},
    en: {hint:'What does this number mean?',title:'Understanding today’s count',meaning:n=>n==null?'Today’s count is not available in the new format yet.':n+' anonymous browser IDs opened Selah today. This is not an exact count of people.',items:['Multiple opens in the same browser today count once.','Different devices or browsers, private windows, and cleared site data may count separately.','Visitors are counted whether signed in or not; identities are not matched across accounts.','A new count starts at 00:00 UTC, which is 9:00 a.m. in Korea.'],period:'Period: today from 00:00 UTC until now.',privacy:'Reflection and prayer text, Bible passages, and account details are not part of visit statistics.'},
    ja: {hint:'この数字の意味',title:'今日の数値について',meaning:n=>n==null?'新しい形式での今日の集計はまだ利用できません。':'今日Selahを開いた匿名ブラウザーIDは'+n+'個です。実際の人数とは一致しません。',items:['同じブラウザーで今日何度開いても1回と数えます。','別の端末・ブラウザー、プライベートウィンドウ、保存データの削除は別に数える場合があります。','ログインの有無にかかわらず集計します。アカウントをまたいだ本人確認はしません。','UTC 0時に新しい集計が始まります。日本時間は午前9時です。'],period:'期間：UTC今日の0時から現在まで。',privacy:'黙想・祈りの内容、聖書箇所、アカウント情報は訪問統計に含みません。'},
    'zh-CN': {hint:'了解数字的含义',title:'今日统计说明',meaning:n=>n==null?'新统计格式下的今日数据暂不可用。':'今天打开Selah的匿名浏览器ID有'+n+'个，这不等于实际人数。',items:['同一浏览器今天多次打开只计一次。','不同设备或浏览器、无痕窗口以及清除本地数据可能分别计数。','无论是否登录都会统计；不会跨账户识别同一个人。','每天UTC 00:00重新开始，即韩国时间上午9点。'],period:'统计时间：UTC今天00:00至现在。',privacy:'访问统计不包含灵修、祷告内容、圣经经文或账户信息。'},
    'zh-TW': {hint:'了解數字的意思',title:'今日統計說明',meaning:n=>n==null?'新統計格式下的今日資料暫不可用。':'今天開啟Selah的匿名瀏覽器ID有'+n+'個，這不等於實際人數。',items:['同一瀏覽器今天多次開啟只計一次。','不同裝置或瀏覽器、私密視窗及清除本機資料可能分別計算。','不論是否登入都會統計；不會跨帳戶辨識同一個人。','每天UTC 00:00重新開始，即韓國時間上午9點。'],period:'統計期間：UTC今日00:00至現在。',privacy:'造訪統計不包含靈修、禱告內容、聖經經文或帳戶資料。'}
  };
  function render(total, locale) {
    const text = copy[locale] || copy.en;
    document.getElementById('visitorExplanationHint').textContent = text.hint;
    const title = document.createElement('h3');
    title.textContent = text.title;
    const meaning = document.createElement('p');
    meaning.textContent = text.meaning(total == null || !Number.isFinite(Number(total)) ? null : Number(total).toLocaleString(locale));
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
