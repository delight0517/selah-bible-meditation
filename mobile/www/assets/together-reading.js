(() => {
  const bridge = window.SelahTogetherBridge;
  if (!bridge) return;
  const endpoint = 'https://selah-together.rogan2534.workers.dev';
  const $ = id => document.getElementById(id);
  const texts = {
    ko: ['함께 읽기', '친구와 함께 동시에 성경 읽기 초대', '이 URL을 보내면 같은 말씀 페이지에서 함께 읽어요. 상대의 읽는 위치가 옅게 표시되고, 시간 묵상은 같은 종료 시각을 사용해요.', '링크 복사', '닫기', '함께 읽기 나가기', '상대 참여를 기다리는 중', '함께 읽는 중', '연결을 다시 확인하는 중…', '초대 링크를 만들지 못했어요. 연결을 확인하고 다시 눌러 주세요.', '링크를 가진 사람은 본문과 읽는 위치를 볼 수 있어요. 묵상·기도·계정 정보는 공유하지 않으며 방은 24시간 후 만료돼요.', '상대', '읽는 위치', '공유 시간이 끝났어요.', '초대 링크가 만료됐거나 방에 연결할 수 없어요.'],
    en: ['Read together', 'Invite a friend to read Scripture together', 'Send this URL to open the same Scripture page. Faint markers show where others are reading. Timed meditation uses one shared end time.', 'Copy link', 'Close', 'Leave together reading', 'Waiting for someone to join', 'Reading together', 'Reconnecting…', 'Could not create a link. Check your connection and try again.', 'Anyone with this link can see the passage and reading positions. Notes, prayers and account details stay private. Rooms expire after 24 hours.', 'Reader', 'Reading position', 'The shared timer has ended.', 'This invitation expired or the room could not be reached.'],
    ja: ['一緒に読む', '友だちとの共同朗読に招待', 'URLを送ると同じ聖書ページが開きます。相手の読んでいる位置を薄く表示し、時間黙想は終了時刻を共有します。', 'リンクをコピー', '閉じる', '共同朗読を退出', '参加を待っています', '一緒に読んでいます', '再接続中…', 'リンクを作成できません。接続を確認してください。', 'リンクを持つ人は聖書箇所と読書位置を確認できます。黙想・祈り・アカウント情報は共有しません。24時間で期限切れです。', '参加者', '読書位置', '共有時間が終了しました。', '招待が期限切れか、接続できません。'],
    'zh-CN': ['一起阅读', '邀请朋友一起读圣经', '发送URL即可打开同一经文页面。淡色标记显示对方阅读的位置，定时默想使用相同结束时间。', '复制链接', '关闭', '退出一起阅读', '等待对方加入', '正在一起阅读', '重新连接中…', '无法创建链接，请检查网络。', '持有链接的人可以看到经文和阅读位置。默想、祷告和账户信息不会共享。房间24小时后到期。', '读者', '阅读位置', '共同计时已结束。', '邀请已过期或无法连接。'],
    'zh-TW': ['一起閱讀', '邀請朋友一起讀聖經', '傳送URL即可開啟同一經文頁面。淡色標記顯示對方閱讀的位置，定時默想使用相同結束時間。', '複製連結', '關閉', '退出一起閱讀', '等待對方加入', '正在一起閱讀', '重新連線中…', '無法建立連結，請檢查網路。', '持有連結的人可以看到經文和閱讀位置。默想、禱告和帳戶資訊不會共享。房間24小時後到期。', '讀者', '閱讀位置', '共同計時已結束。', '邀請已到期或無法連線。']
  };
  const t = i => (texts[bridge.locale()] || texts.en)[i];
  let session = null, snapshot = null, timerKey = '', passageKey = '', busy = false, poll = 0, offset = 0;
  const hex = bytes => [...crypto.getRandomValues(new Uint8Array(bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
  const modal = document.createElement('div'); modal.className = 'modal'; modal.id = 'togetherInviteModal';
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'togetherInviteTitle');
  modal.innerHTML = '<div class="dialog together-invite-dialog"><h2 id="togetherInviteTitle"></h2><p id="togetherInviteHelp"></p><label for="togetherInviteUrl">URL</label><input id="togetherInviteUrl" readonly><p id="togetherInvitePrivacy" class="note"></p><p id="togetherInviteResult" role="status"></p><div class="dialog-actions"><button id="sendTogetherInvite" type="button" class="btn"></button><button id="copyTogetherInvite" type="button" class="btn"></button><button id="closeTogetherInvite" type="button" class="btn secondary"></button></div></div>';
  document.body.append(modal);
  const bars = [];
  for (const readerId of ['verseText', 'meditationVerse']) {
    const bar = document.createElement('div'); bar.className = 'together-bar'; bar.hidden = true;
    const status = document.createElement('div'); status.className = 'together-status'; status.setAttribute('role', 'status');
    const peers = document.createElement('div'); peers.className = 'together-peers';
    const invite = document.createElement('button'); invite.className = 'btn ghost'; invite.type = 'button'; invite.textContent = t(1); invite.onclick = showInvite;
    const leave = document.createElement('button'); leave.className = 'btn ghost'; leave.type = 'button'; leave.textContent = t(5); leave.onclick = leaveRoom;
    bar.append(status, peers, invite, leave); $(readerId).before(bar); bars.push({bar,status,peers});
  }
  for (const targetId of ['sharePassageMenu', 'toggleMeditationTools']) {
    const button = document.createElement('button'); button.className = 'btn ghost together-entry'; button.type = 'button'; button.textContent = t(0); button.id = targetId === 'sharePassageMenu' ? 'startTogetherReading' : 'startTogetherMeditation'; button.onclick = createRoom; if (targetId === 'sharePassageMenu') document.querySelector('.passage-picker').append(button); else $(targetId).before(button);
  }
  $('shareTogether').onclick = createRoom;
  $('closeTogetherInvite').onclick = () => modal.style.display = 'none';
  modal.onclick = event => { if(event.target === modal) modal.style.display = 'none'; };
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && modal.style.display === 'flex') { modal.style.display = 'none'; event.stopImmediatePropagation(); } }, true);
  $('copyTogetherInvite').onclick = async () => {
    try { await navigator.clipboard.writeText($('togetherInviteUrl').value); $('togetherInviteResult').textContent = bridge.locale() === 'ko' ? '링크를 복사했어요.' : 'Copied'; }
    catch { $('togetherInviteUrl').focus(); $('togetherInviteUrl').select(); }
  };
  $('sendTogetherInvite').hidden = !navigator.share;
  $('sendTogetherInvite').onclick = async () => {
    try { await navigator.share({title:t(0),url:$('togetherInviteUrl').value}); }
    catch(error) { if(error.name!=='AbortError')$('togetherInviteResult').textContent=t(9); }
  };
  function inviteUrl() {
    const url = new URL('https://delight0517.github.io/selah-bible-meditation/');
    const passage = snapshot?.passage || bridge.current().passage;
    const shared = new URL(window.SelahReadingLinks.web(passage, session.roomId, position().verse));
    url.search = shared.search; url.hash = shared.hash;
    if(new URLSearchParams(location.search).get('selah_qa') === '1') url.searchParams.set('selah_qa','1');
    return url.href;
  }
  function showInvite() {
    if(!session) return;
    $('togetherInviteTitle').textContent=t(1); $('togetherInviteHelp').textContent=t(2); $('togetherInvitePrivacy').textContent=t(10);
    $('sendTogetherInvite').textContent=bridge.locale()==='ko'?'링크 보내기':'Share link'; $('copyTogetherInvite').textContent=t(3); $('closeTogetherInvite').textContent=t(4); $('togetherInviteUrl').value=inviteUrl(); $('togetherInviteResult').textContent='';
    modal.style.display='flex'; $('copyTogetherInvite').focus();
  }
  async function request(path, method='GET', data, host=false) {
    const headers = {'content-type':'application/json'};
    if(host) headers.authorization='Bearer '+session.hostToken;
    const response = await fetch(endpoint+path,{method,headers,body:data?JSON.stringify(data):undefined,cache:'no-store',signal:AbortSignal.timeout(10000)});
    const result=await response.json(); if(!response.ok) throw Object.assign(Error(result.error || 'Room unavailable'),{status:response.status}); return result;
  }
  async function createRoom() {
    if(session) { showInvite(); return; }
    const button=this instanceof HTMLButtonElement?this:null;
    if(button) button.disabled=true;
    try {
      const current=bridge.current(); if(!current.passage || current.custom) throw Error('custom');
      const room=await request('/rooms','POST',{passage:current.passage,timer:current.timer?{durationMs:Math.max(1000,Math.round(current.timer.endsAt-Date.now()))}:null});
      session={roomId:room.roomId,hostToken:room.hostToken,participantId:hex(16)};
      await join(); $('sharePassageModal').style.display='none'; showInvite();
    } catch { session=null; bridge.toast(t(9)); } finally { if(button) button.disabled=false; }
  }
  async function join() {
    const start=Date.now(); const room=await request('/rooms/'+session.roomId+'/join','POST',{participantId:session.participantId});
    offset=room.serverNow-(start+Date.now())/2;
    sessionStorage.setItem('selah.together.'+session.roomId,JSON.stringify(session));
    history.replaceState(null,'',inviteUrl());
    await apply(room); clearInterval(poll); poll=setInterval(tick,2000); void tick();
  }
  async function apply(room) {
    const previous = snapshot;
    snapshot=room;
    const key=JSON.stringify(room.passage);
    if(key!==passageKey || JSON.stringify(bridge.current().passage)!==key) {
      await bridge.open(room.passage); passageKey=key;
    }
    const timeKey=JSON.stringify(room.timer);
    if(timeKey!==timerKey) {
      timerKey=timeKey;
      if(room.timer && room.timer.endsAt>room.serverNow) await bridge.timer(room.timer,offset,session.roomId);
      else if(!room.timer) await bridge.read();
    }
    renderPeers(room);
    if (!previous || JSON.stringify(previous.passage) !== JSON.stringify(room.passage) || previous.participants?.filter(row=>row.active).length !== room.participants?.filter(row=>row.active).length) {
      await bridge.recordRoom?.({roomId:session.roomId, passage:room.passage, participantCount:room.participants.filter(row=>row.active).length, endedAt:null});
    }
  }
  function position() {
    const reader=bridge.reader(), rect=reader.getBoundingClientRect();
    const top=Math.max(0,rect.top)+Math.min(160,Math.max(30,reader.clientHeight*.25));
    const verses=[...reader.querySelectorAll('.bible-verse')];
    const verse=verses.find(node=>node.getBoundingClientRect().bottom>top) || verses.at(-1);
    return {verse:Number(verse?.querySelector('.bible-verse-num')?.textContent)||1,progress:Math.max(0,Math.min(1,reader.scrollTop/Math.max(1,reader.scrollHeight-reader.clientHeight))),active:document.visibilityState==='visible'};
  }
  function renderPeers(room) {
    const peers=room.participants.filter(row=>row.participantId!==session.participantId && row.active);
    for(const {bar,status,peers:list} of bars) {
      bar.hidden=false; status.textContent=peers.length?t(7)+' · '+(peers.length+1):t(6);
      list.replaceChildren(); peers.forEach((peer,i)=>{const label=document.createElement('span');label.textContent=t(11)+' '+(i+1)+' · '+peer.verse+(bridge.locale()==='ko'?'절':'');list.append(label);});
    }
    document.querySelectorAll('.together-peer-verse').forEach(node=>{node.classList.remove('together-peer-verse');node.removeAttribute('data-together-peer');});
    for(const readerId of ['verseText','meditationVerse']) for(const node of $(readerId).querySelectorAll('.bible-verse')) {
      const verse=Number(node.querySelector('.bible-verse-num')?.textContent), at=peers.map((peer,i)=>peer.verse===verse?t(11)+' '+(i+1):'').filter(Boolean);
      if(at.length) { node.classList.add('together-peer-verse');node.dataset.togetherPeer=at.join(', ')+' · '+t(12); }
    }
  }
  async function tick() {
    if(!session || busy) return; busy=true;
    try {
      const current=bridge.current();
      if(session.hostToken && current.timer && !snapshot?.timer) await request('/rooms/'+session.roomId,'PATCH',{timer:{durationMs:Math.max(1000,Math.round(current.timer.endsAt-Date.now()))}},true);
      if(session.hostToken && current.passage && JSON.stringify(current.passage)!==passageKey) await request('/rooms/'+session.roomId,'PATCH',{passage:current.passage},true);
      const start=Date.now(); const room=await request('/rooms/'+session.roomId+'/presence','POST',{participantId:session.participantId,...position()});
      offset=room.serverNow-(start+Date.now())/2; await apply(room);
    } catch(error) { if(error.status===403) { try { await join(); } catch {} } for(const {status} of bars) status.textContent=t(8); }
    finally { busy=false; }
  }
  async function leaveRoom() {
    const old=session; if(!old)return;
    if (snapshot?.passage) await bridge.recordRoom?.({roomId:old.roomId, passage:snapshot.passage, participantCount:snapshot.participants.filter(row=>row.active).length, endedAt:Date.now()});
    try { await request('/rooms/'+old.roomId+'/leave','POST',{participantId:old.participantId}); } catch {}
    clearInterval(poll); sessionStorage.removeItem('selah.together.'+old.roomId); session=null;snapshot=null;passageKey='';timerKey='';
    for(const {bar} of bars)bar.hidden=true;
    document.querySelectorAll('.together-peer-verse').forEach(node=>{node.classList.remove('together-peer-verse');node.removeAttribute('data-together-peer');});
    const url=new URL(location.href);url.hash='';url.searchParams.delete('selahRoom');history.replaceState(null,'',url); modal.style.display='none';
  }
  async function boot() {
    const roomId=new URLSearchParams(location.search).get('selahRoom') || new URLSearchParams(location.hash.slice(1)).get('selahRoom'); if(!/^[a-f0-9]{32}$/.test(roomId||'')) return;
    try {
      const saved=JSON.parse(sessionStorage.getItem('selah.together.'+roomId)||'null');
      session=saved?.roomId===roomId?saved:{roomId,participantId:hex(16)}; await join();
      const shared=window.SelahReadingLinks.parse(location.href);
      if(shared&&snapshot?.passage.book===shared.book&&snapshot?.passage.chapter===shared.chapter)bridge.goToVerse?.(shared.verse);
    } catch {session=null;bridge.toast(t(14));}
  }
  if (!window.Capacitor?.isNativePlatform?.() && !window.webkit?.messageHandlers?.selahNative && (new URLSearchParams(location.hash.slice(1)).has('selahRoom') || new URLSearchParams(location.search).has('selahRoom'))) {
    const nativeUrl=window.SelahReadingLinks.native(location.href);
    if(nativeUrl){const open=document.createElement('a');open.className='btn ghost';open.href=nativeUrl;open.textContent=bridge.locale()==='ko'?'Selah 앱에서 열기':'Open in Selah';$('verseText').before(open);}
  }
  document.addEventListener('visibilitychange',()=>void tick());
  window.addEventListener('online',()=>void tick());
  window.SelahTogether={create:createRoom,leave:leaveRoom,current:()=>session&&snapshot?{roomId:session.roomId,passage:snapshot.passage,participantCount:snapshot.participants.filter(row=>row.active).length}:null};
  void boot();
})();
