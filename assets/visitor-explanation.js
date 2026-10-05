(() => {
  const button = document.getElementById('visitorExplanationToggle');
  const panel = document.getElementById('visitorExplanation');
  if (!button || !panel) return;
  const copy = {
    ko: {hint:'숫자 기준 보기', title:'숫자마다 집계 기준이 달라요', today:'오늘 고유 브라우저', month:'이번 달 고유 브라우저', body:'상단 숫자와 오늘 항목은 UTC 날짜 하루 동안 방문한 익명 브라우저 수예요. 이번 달 숫자는 UTC 달력 월 안의 서로 다른 익명 브라우저 ID 수예요. 한 사람이 여러 기기나 브라우저를 쓰면 여러 개로 잡힐 수 있어 실제 사람 수와 같지 않습니다.', map:'나라·지역 숫자는 날짜별 브라우저 방문 합계(브라우저·일)예요. 같은 브라우저가 다른 날 다시 오면 다시 더해져 월간 고유 브라우저 수보다 커질 수 있습니다. 계정 수나 현재 접속자 수가 아닙니다.', period:'표시된 UTC 날짜 범위를 기준으로 집계합니다.'},
    en: {hint:'About these counts', title:'Each number uses a different period', today:'Unique browsers today', month:'Unique browsers this month', body:'The top badge and Today count anonymous browsers for one UTC day. The month count is distinct anonymous browser IDs in the UTC calendar month. One person may count more than once across devices or browsers, so these are not verified people.', map:'Country and region numbers add browser visits by day (browser-days). A browser returning on another day is counted again, so this can exceed the monthly unique-browser count. These are not accounts or people online now.', period:'Counts use the UTC date range shown above.'},
    ja: {hint:'集計方法を見る', title:'数字ごとに期間が異なります', today:'今日のユニークブラウザー', month:'今月のユニークブラウザー', body:'上部と今日の数はUTCの1日に訪れた匿名ブラウザー数です。月間数はUTC暦月内の異なる匿名ブラウザーID数です。同じ人が複数の端末やブラウザーを使うと複数として数えられるため、実際の人数ではありません。', map:'国・地域の数は日ごとのブラウザー訪問数（ブラウザー日）の合計です。別の日に再訪すると再び加算され、月間ユニーク数を上回ることがあります。アカウント数や現在のオンライン人数ではありません。', period:'上記のUTC日付範囲で集計しています。'},
    'zh-CN': {hint:'查看统计口径', title:'不同数字代表不同统计周期', today:'今日独立浏览器', month:'本月独立浏览器', body:'顶部和“今日”统计UTC当天访问的匿名浏览器。本月统计UTC自然月内不同的匿名浏览器ID。同一人使用多个设备或浏览器可能被多次统计，因此不等于实际人数。', map:'国家和地区数字是按日累计的浏览器访问（浏览器日）。同一浏览器在不同日期再次访问会再次计入，因此可能高于本月独立浏览器数。这不是账户数或当前在线人数。', period:'统计范围为上方显示的UTC日期。'},
    'zh-TW': {hint:'查看統計口徑', title:'不同數字代表不同統計期間', today:'今日不重複瀏覽器', month:'本月不重複瀏覽器', body:'頂部和「今日」統計UTC當天造訪的匿名瀏覽器。本月統計UTC自然月內不同的匿名瀏覽器ID。同一人使用多個裝置或瀏覽器可能被重複計算，因此不等於實際人數。', map:'國家與地區數字是每日瀏覽器造訪（瀏覽器日）的總和。同一瀏覽器在不同日期再次造訪會再次計入，因此可能高於本月不重複瀏覽器數。這不是帳戶數或目前在線人數。', period:'統計範圍為上方顯示的UTC日期。'},
    fil: {hint:'Tungkol sa bilang', title:'Magkaiba ang saklaw ng mga bilang', today:'Mga natatanging browser ngayong araw', month:'Mga natatanging browser ngayong buwan', body:'Binibilang ng nasa itaas at ng “Ngayon” ang mga anonymous na browser sa isang araw ng UTC. Binibilang ng buwanang bilang ang magkakaibang anonymous browser ID sa buwang UTC. Maaaring mabilang nang higit sa isa ang isang tao na may maraming device o browser, kaya hindi ito tiyak na bilang ng tao.', map:'Pinagsasama ng bilang sa bansa at rehiyon ang mga pagbisita ng browser bawat araw (browser-araw). Kapag bumalik ang browser sa ibang araw, bibilangin muli kaya maaaring mas mataas ito sa buwanang natatanging browser. Hindi ito bilang ng account o kasalukuyang online na tao.', period:'Batay ang bilang sa saklaw ng petsang UTC sa itaas.'},
    es: {hint:'Sobre estos recuentos', title:'Cada cifra usa un periodo distinto', today:'Navegadores únicos hoy', month:'Navegadores únicos este mes', body:'La cifra superior y la de hoy cuentan navegadores anónimos durante un día UTC. La cifra mensual cuenta IDs de navegador anónimos distintos en el mes UTC. Una persona puede aparecer varias veces si usa varios dispositivos o navegadores; no equivale a personas reales.', map:'Las cifras por país y región suman visitas del navegador por día (navegador-días). Si vuelve otro día, se cuenta de nuevo y puede superar el total mensual de navegadores únicos. No son cuentas ni personas conectadas ahora.', period:'El recuento usa el intervalo de fechas UTC indicado arriba.'},
    'pt-BR': {hint:'Sobre estas contagens', title:'Cada número usa um período diferente', today:'Navegadores únicos hoje', month:'Navegadores únicos neste mês', body:'O número superior e o de hoje contam navegadores anônimos em um dia UTC. O número mensal conta IDs anônimos distintos no mês UTC. Uma pessoa pode aparecer várias vezes se usar vários dispositivos ou navegadores; não equivale a pessoas reais.', map:'Os números por país e região somam visitas do navegador por dia (navegador-dias). Se voltar em outro dia, contará novamente e poderá superar o total mensal de navegadores únicos. Não são contas nem pessoas online agora.', period:'A contagem usa o intervalo de datas UTC indicado acima.'}
  };
  function render(today, month, start, end, locale) {
    const text = copy[locale] || copy.en;
    document.getElementById('visitorExplanationHint').textContent = text.hint;
    const title = document.createElement('h3'); title.textContent = text.title;
    const definition = document.createElement('p'); definition.textContent = `${text.today}: ${Number(today).toLocaleString(locale)} · ${text.month}: ${Number(month).toLocaleString(locale)}.`;
    const details = document.createElement('p'); details.textContent = text.body;
    const map = document.createElement('p'); map.textContent = text.map;
    const period = document.createElement('p'); period.textContent = `${text.period} ${start}–${end} UTC`;
    panel.replaceChildren(title, definition, details, map, period);
  }
  button.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });
  window.SelahVisitorExplanation = { render };
})();
