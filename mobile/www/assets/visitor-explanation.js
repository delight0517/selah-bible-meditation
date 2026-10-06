(() => {
  const button = document.getElementById('visitorExplanationToggle');
  const panel = document.getElementById('visitorExplanation');
  if (!button || !panel) return;
  const copy = {
    ko: {hint:'숫자 기준 보기', title:'숫자마다 집계 기준이 달라요', today:'오늘 이 앱을 이용한 사람', month:'이번 달 이 앱을 이용한 사람', body:'상단 숫자와 오늘 항목은 UTC 날짜 하루 동안 방문한 익명 브라우저 수예요. 이번 달 숫자는 UTC 달력 월 안의 서로 다른 익명 브라우저 ID 수예요. 한 사람이 여러 기기나 브라우저를 쓰면 여러 개로 잡힐 수 있어 실제 사람 수와 같지 않습니다.', map:'지도는 최근 7일 동안 한 번 이상 이용한 익명 브라우저를 한 번씩 셉니다. 한 사람이 여러 기기나 브라우저를 쓰면 중복될 수 있어 실제 사람 수와는 다를 수 있습니다.', period:'표시된 UTC 날짜 범위를 기준으로 집계합니다.'},
    en: {hint:'About these counts', title:'Each number uses a different period', today:'People who used the app today', month:'People who used the app this month', body:'The top badge and Today count anonymous browsers for one UTC day. The month count is distinct anonymous browser IDs in the UTC calendar month. One person may count more than once across devices or browsers, so these are not verified people.', map:'The map counts each anonymous browser once if it used the app at least once in the past 7 days. One person may count more than once across devices or browsers, so this is not an exact people total.', period:'Counts use the UTC date range shown above.'},
    ja: {hint:'集計方法を見る', title:'数字ごとに期間が異なります', today:'今日アプリを利用した人', month:'今月アプリを利用した人', body:'上部と今日の数はUTCの1日に訪れた匿名ブラウザー数です。月間数はUTC暦月内の異なる匿名ブラウザーID数です。同じ人が複数の端末やブラウザーを使うと複数として数えられるため、実際の人数ではありません。', map:'地図は過去7日間に1回以上利用した匿名ブラウザーを1回ずつ数えます。複数の端末やブラウザーを使う人は重複するため、実際の人数とは異なる場合があります。', period:'上記のUTC日付範囲で集計しています。'},
    'zh-CN': {hint:'查看统计口径', title:'不同数字代表不同统计周期', today:'今日使用此应用的人', month:'本月使用此应用的人', body:'顶部和“今日”统计UTC当天访问的匿名浏览器。本月统计UTC自然月内不同的匿名浏览器ID。同一人使用多个设备或浏览器可能被多次统计，因此不等于实际人数。', map:'地图按匿名浏览器去重，统计过去7天至少使用过一次应用的浏览器。同一人使用多个设备或浏览器时可能被重复统计，因此不等于实际人数。', period:'统计范围为上方显示的UTC日期。'},
    'zh-TW': {hint:'查看統計口徑', title:'不同數字代表不同統計期間', today:'今日使用此應用的人', month:'本月使用此應用的人', body:'頂部和「今日」統計UTC當天造訪的匿名瀏覽器。本月統計UTC自然月內不同的匿名瀏覽器ID。同一人使用多個裝置或瀏覽器可能被重複計算，因此不等於實際人數。', map:'地圖會將匿名瀏覽器去重，統計過去7天至少使用過一次此應用的瀏覽器。同一人使用多個裝置或瀏覽器時可能重複計算，因此不等於實際人數。', period:'統計範圍為上方顯示的UTC日期。'},
    fil: {hint:'Tungkol sa bilang', title:'Magkaiba ang saklaw ng mga bilang', today:'Mga gumamit ng app ngayong araw', month:'Mga gumamit ng app ngayong buwan', body:'Binibilang ng nasa itaas at ng “Ngayon” ang mga anonymous na browser sa isang araw ng UTC. Binibilang ng buwanang bilang ang magkakaibang anonymous browser ID sa buwang UTC. Maaaring mabilang nang higit sa isa ang isang tao na may maraming device o browser, kaya hindi ito tiyak na bilang ng tao.', map:'Isang beses binibilang sa mapa ang bawat anonymous na browser na gumamit ng app kahit isang beses sa nakaraang 7 araw. Maaaring madoble ang taong gumagamit ng maraming device o browser, kaya hindi ito eksaktong bilang ng tao.', period:'Batay ang bilang sa saklaw ng petsang UTC sa itaas.'},
    es: {hint:'Sobre estos recuentos', title:'Cada cifra usa un periodo distinto', today:'Personas que usaron la app hoy', month:'Personas que usaron la app este mes', body:'La cifra superior y la de hoy cuentan navegadores anónimos durante un día UTC. La cifra mensual cuenta IDs de navegador anónimos distintos en el mes UTC. Una persona puede aparecer varias veces si usa varios dispositivos o navegadores; no equivale a personas reales.', map:'El mapa cuenta una vez cada navegador anónimo que usó la app al menos una vez en los últimos 7 días. Una persona puede contarse varias veces si usa varios dispositivos o navegadores; no es un total exacto de personas.', period:'El recuento usa el intervalo de fechas UTC indicado arriba.'},
    'pt-BR': {hint:'Sobre estas contagens', title:'Cada número usa um período diferente', today:'Pessoas que usaram o app hoje', month:'Pessoas que usaram o app neste mês', body:'O número superior e o de hoje contam navegadores anônimos em um dia UTC. O número mensal conta IDs anônimos distintos no mês UTC. Uma pessoa pode aparecer várias vezes se usar vários dispositivos ou navegadores; não equivale a pessoas reais.', map:'O mapa conta uma vez cada navegador anônimo que usou o app pelo menos uma vez nos últimos 7 dias. Uma pessoa pode ser contada várias vezes se usar vários dispositivos ou navegadores; não é um total exato de pessoas.', period:'A contagem usa o intervalo de datas UTC indicado acima.'}
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
