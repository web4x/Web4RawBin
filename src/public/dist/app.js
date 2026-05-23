var T=Object.defineProperty;var f=(r,t,e)=>t in r?T(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var o=(r,t,e)=>f(r,typeof t!="symbol"?t+"":t,e);var a={CREATE_ROOM:"CREATE_ROOM",JOIN_ROOM:"JOIN_ROOM",LEAVE_ROOM:"LEAVE_ROOM",LIST_ROOMS:"LIST_ROOMS",DELETE_ROOM:"DELETE_ROOM",REMOVE_ROOM:"REMOVE_ROOM",CHAT_MESSAGE:"CHAT_MESSAGE",SPECTATE:"SPECTATE",LEAVE_SPECTATE:"LEAVE_SPECTATE",JOIN_ROOM_FROM_SPECTATE:"JOIN_ROOM_FROM_SPECTATE",IDENTIFY:"IDENTIFY",CONSOLIDATE:"CONSOLIDATE",UPDATE_SECRET_CODE:"UPDATE_SECRET_CODE",UPDATE_PROFILE:"UPDATE_PROFILE",GET_USER_INFO:"GET_USER_INFO",BUG_REPORT:"BUG_REPORT",PAIR_BUG_REPORT:"PAIR_BUG_REPORT",ROOM_LIST:"ROOM_LIST",ROOM_JOINED:"ROOM_JOINED",ROOM_LEFT:"ROOM_LEFT",ROOM_DELETED:"ROOM_DELETED",MEMBER_JOINED:"MEMBER_JOINED",MEMBER_LEFT:"MEMBER_LEFT",MEMBER_DISCONNECTED:"MEMBER_DISCONNECTED",HOST_CHANGED:"HOST_CHANGED",CHAT_HISTORY:"CHAT_HISTORY",SPECTATE_JOINED:"SPECTATE_JOINED",SPECTATE_LEFT:"SPECTATE_LEFT",SPECTATOR_JOINED:"SPECTATOR_JOINED",SPECTATOR_LEFT:"SPECTATOR_LEFT",SERVER_CONFIG:"SERVER_CONFIG",ERROR:"ERROR",PROFILE:"PROFILE",TOKEN_REDIRECT:"TOKEN_REDIRECT",CONSOLIDATE_OK:"CONSOLIDATE_OK",CONSOLIDATE_FAILED:"CONSOLIDATE_FAILED",SECRET_CODE_OK:"SECRET_CODE_OK",SECRET_CODE_FAILED:"SECRET_CODE_FAILED",PROFILE_UPDATED:"PROFILE_UPDATED",USER_INFO:"USER_INFO",BUG_REPORT_OK:"BUG_REPORT_OK",PAIR_OK:"PAIR_OK"};var m=class{constructor(){o(this,"ws",null);o(this,"handlers",new Map);o(this,"_profile",null);o(this,"clientId","");o(this,"connected",!1);o(this,"playerToken");o(this,"deviceId");let t=localStorage.getItem("rawbin-player-id");t||(t=crypto.randomUUID(),localStorage.setItem("rawbin-player-id",t)),this.playerToken=t;let e=localStorage.getItem("rawbin-device-id");e||(e=crypto.randomUUID(),localStorage.setItem("rawbin-device-id",e)),this.deviceId=e}isProfileCommitted(){return this._profile?.profileCommitted===!0}getProfile(){return this._profile}connect(){return new Promise((t,e)=>{let i=location.protocol==="https:"?"wss:":"ws:";this.ws=new WebSocket(`${i}//${location.host}`),this.ws.onopen=()=>{this.connected=!0,t()},this.ws.onclose=()=>{this.connected=!1,this.emit("disconnected",{})},this.ws.onerror=()=>e(new Error("WebSocket connection failed")),this.ws.onmessage=n=>{try{let s=JSON.parse(n.data);s.type==="welcome"&&(this.clientId=s.clientId,this.send({type:a.IDENTIFY,playerToken:this.playerToken,deviceId:this.deviceId,name:localStorage.getItem("rawbin-name")||"",avatar:localStorage.getItem("rawbin-avatar")||"",screenWidth:screen.width,screenHeight:screen.height,platform:navigator.platform})),s.type===a.TOKEN_REDIRECT&&s.newToken&&localStorage.setItem("rawbin-player-id",s.newToken),(s.type===a.PROFILE||s.type===a.PROFILE_UPDATED)&&s.profile&&(this._profile=s.profile),this.emit(s.type,s)}catch{}}})}async reconnect(){if(this.ws)try{this.ws.close()}catch{}this.ws=null,this.connected=!1,this.emit("reconnecting",{}),await this.connect(),this.emit("reconnected",{})}send(t){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(t))}on(t,e){this.handlers.has(t)||this.handlers.set(t,[]),this.handlers.get(t).push(e)}off(t,e){if(!e){this.handlers.delete(t);return}let i=this.handlers.get(t);i&&this.handlers.set(t,i.filter(n=>n!==e))}once(t){return new Promise(e=>{let i=n=>{this.off(t,i),e(n)};this.on(t,i)})}emit(t,e){this.handlers.get(t)?.forEach(i=>i(e))}createRoom(t,e,i,n){this.send({type:a.CREATE_ROOM,roomName:t,playerName:e,maxPlayers:i,roomKey:n,playerToken:this.playerToken})}joinRoom(t,e,i){this.send({type:a.JOIN_ROOM,roomId:t,playerName:e,roomKey:i,playerToken:this.playerToken})}leaveRoom(){this.send({type:a.LEAVE_ROOM})}listRooms(){this.send({type:a.LIST_ROOMS})}deleteRoom(t){this.send({type:a.DELETE_ROOM,roomId:t})}removeRoom(t){this.send({type:a.REMOVE_ROOM,roomId:t})}spectateRoom(t,e){this.send({type:a.SPECTATE,roomId:t,playerName:e})}leaveSpectate(){this.send({type:a.LEAVE_SPECTATE})}joinFromSpectate(t){this.send({type:a.JOIN_ROOM_FROM_SPECTATE,playerName:t})}sendChat(t){this.send({type:a.CHAT_MESSAGE,text:t})}sendBugReport(t){this.send({type:a.BUG_REPORT,text:t})}};function y(r,t){r.addEventListener("click",async()=>{if(!r.disabled){r.disabled=!0,r.classList.add("loading");try{await t()}finally{r.disabled=!1,r.classList.remove("loading")}}})}async function h(r,t,e){let i=e?` \u2014 ${e}`:"";if(navigator.share)try{await navigator.share({title:`RawBin${i}`,text:`Join my room on RawBin${i}`,url:r})}catch{}else try{await navigator.clipboard.writeText(`Join my RawBin room: ${r}${i}`)}catch{prompt("Copy this link:",r);return}if(t){let n=t.textContent;t.textContent="Shared!",setTimeout(()=>{t.textContent=n},2e3)}}var p=class{constructor(t,e,i){o(this,"client");o(this,"container");o(this,"rooms",[]);o(this,"memberName","");o(this,"onEnterRoom");this.client=t,this.container=e,this.onEnterRoom=i;let n=new URLSearchParams(window.location.search);this.memberName=n.get("name")||localStorage.getItem("rawbin-name")||`User ${Math.floor(Math.random()*1e3)}`,this.client.on(a.ROOM_LIST,l=>{this.rooms=l.rooms,this.renderRoomList()}),this.client.on(a.ROOM_JOINED,l=>{this.onEnterRoom(l.room.id)}),this.client.on(a.ERROR,l=>{this.showError(l.message)});let s=n.get("join");this.client.on("welcome",()=>{this.client.listRooms(),s&&this.client.joinRoom(s,this.memberName)})}show(){this.render(),this.client.listRooms()}hide(){this.container.innerHTML=""}render(){this.container.innerHTML=`
      <div class="lobby">
        <div class="lobby-header">
          <h1>RawBin</h1>
          <p class="lobby-subtitle">Collaborative Rooms</p>
        </div>
        <div class="lobby-name">
          <label>Your Name</label>
          <input type="text" id="member-name" value="${this.memberName}" maxlength="20" placeholder="Enter name...">
        </div>
        <div class="lobby-actions">
          <button id="create-room-btn" class="btn btn-primary">Create Room</button>
          <button id="refresh-rooms-btn" class="btn btn-secondary">Refresh</button>
        </div>
        <div class="lobby-create-form" id="create-form" style="display:none">
          <input type="text" id="room-name" placeholder="Room name..." value="My Room">
          <input type="number" id="room-max" placeholder="Max members" value="10" min="2" max="50">
          <input type="text" id="room-key" placeholder="Private key (optional)">
          <div class="lobby-create-actions">
            <button id="confirm-create-btn" class="btn btn-primary">Create</button>
            <button id="cancel-create-btn" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
        <div class="lobby-rooms" id="room-list"><p class="loading">Loading rooms...</p></div>
        <div class="lobby-join-private">
          <input type="text" id="join-room-id" placeholder="Room ID">
          <input type="text" id="join-room-key" placeholder="Key (if private)">
          <button id="join-private-btn" class="btn btn-small">Join Private</button>
        </div>
        <div id="lobby-error" class="lobby-error" style="display:none"></div>
        <div class="lobby-links">
          <a href="/profile">Profile</a> \xB7 <a href="/bug-report">Report Bug</a>
        </div>
      </div>`,this.setupEvents()}setupEvents(){let t=document.getElementById("member-name");t?.addEventListener("change",()=>{this.memberName=t.value.trim()||"User",localStorage.setItem("rawbin-name",this.memberName)}),document.getElementById("create-room-btn")?.addEventListener("click",()=>{document.getElementById("create-form").style.display="block"}),document.getElementById("cancel-create-btn")?.addEventListener("click",()=>{document.getElementById("create-form").style.display="none"}),document.getElementById("confirm-create-btn")?.addEventListener("click",()=>{let e=document.getElementById("room-name").value||"My Room",i=parseInt(document.getElementById("room-max").value)||10,n=document.getElementById("room-key").value||void 0;this.client.createRoom(e,this.memberName,i,n)}),document.getElementById("refresh-rooms-btn")?.addEventListener("click",()=>{this.client.listRooms()}),document.getElementById("join-private-btn")?.addEventListener("click",()=>{let e=document.getElementById("join-room-id").value,i=document.getElementById("join-room-key").value||void 0;e&&this.client.joinRoom(e,this.memberName,i)})}renderRoomList(){let t=document.getElementById("room-list");if(t){if(this.rooms.length===0){t.innerHTML='<p class="no-rooms">No rooms available. Create one!</p>';return}t.innerHTML=this.rooms.map(e=>{let i=e.creatorId===this.client.playerToken,n=e.state==="archived"?"Archived":"Active";return`
        <div class="room-card" data-room-id="${e.id}">
          <div class="room-info">
            <span class="room-name">${e.isPrivate?"\u{1F512} ":""}${e.name}${i?' <span class="owner-badge">owner</span>':""}</span>
            <span class="room-members">${e.memberCount}/${e.maxMembers} members</span>
          </div>
          <div class="room-status">
            <span class="room-state room-state-${e.state}">${n}</span>
            <button class="btn btn-share" data-room="${e.id}" title="Copy join link">\u{1F517}</button>
            ${e.state==="active"?`<button class="btn btn-join" data-room="${e.id}">Join</button>`:""}
            ${e.state==="active"?`<button class="btn btn-spectate" data-room="${e.id}">Watch</button>`:""}
            ${i?`<button class="btn btn-delete" data-room="${e.id}" title="Delete room">\u2715</button>`:""}
          </div>
        </div>`}).join(""),t.querySelectorAll(".btn-join").forEach(e=>{e.addEventListener("click",()=>{this.client.joinRoom(e.dataset.room,this.memberName)})}),t.querySelectorAll(".btn-spectate").forEach(e=>{e.addEventListener("click",()=>{let i=e.dataset.room;this.client.spectateRoom(i,this.memberName),this.onEnterRoom(i)})}),t.querySelectorAll(".btn-share").forEach(e=>{e.addEventListener("click",async()=>{let i=e.dataset.room,n=window.__shareBase||location.origin;await h(`${n}/app?join=${i}`,e)})}),t.querySelectorAll(".btn-delete").forEach(e=>{e.addEventListener("click",()=>{let i=e.dataset.room;confirm("Delete this room?")&&this.client.deleteRoom(i)})})}}showError(t){let e=document.getElementById("lobby-error");e&&(e.textContent=t,e.style.display="block",setTimeout(()=>{e.style.display="none"},3e3))}};var d=class{constructor(t){o(this,"client");o(this,"overlay",null);o(this,"mode","normal");o(this,"onSave",null);this.client=t,this.client.on(a.PROFILE_UPDATED,e=>{this.onSave&&e.profile&&(this.onSave(e.profile),e.profile.name&&localStorage.setItem("rawbin-name",e.profile.name)),this.close()})}open(t={},e="normal",i){this.mode=e,this.onSave=i||null,this.overlay&&this.close(),this.overlay=document.createElement("div"),this.overlay.className=`profile-overlay ${e==="gate"?"profile-gate":""}`,this.overlay.innerHTML=`
      <div class="profile-sheet">
        <div class="profile-header">
          <h3>${e==="gate"?"Set Up Your Profile":"Edit Profile"}</h3>
          ${e==="normal"?'<button class="profile-close" id="pe-close">\u2715</button>':""}
        </div>
        <div class="profile-avatar-row">
          <div class="profile-avatar-preview" id="pe-avatar-preview">${t.avatar?`<img src="${t.avatar}" alt="avatar">`:'<span class="avatar-placeholder">?</span>'}</div>
          <label class="btn btn-small btn-secondary profile-avatar-btn">
            Upload Photo
            <input type="file" accept="image/*" id="pe-avatar-input" style="display:none">
          </label>
        </div>
        <div class="profile-fields">
          <label>Name${e==="gate"?" *":""}</label>
          <input type="text" id="pe-name" value="${t.name||""}" maxlength="20" placeholder="Your name..." ${e==="gate"?"required":""}>
          <label>Phone</label>
          <input type="tel" id="pe-phone" value="${t.phone||""}" maxlength="30" placeholder="Phone number...">
          <label>URL</label>
          <input type="url" id="pe-url" value="${t.url||""}" maxlength="200" placeholder="Website or social link...">
          <label>Secret Code (4 digits)</label>
          <input type="text" id="pe-code" value="${t.secretCode||""}" pattern="[0-9]{4}" maxlength="4" placeholder="1234" inputmode="numeric">
        </div>
        <button class="btn btn-primary profile-save" id="pe-save" ${e==="gate"&&!t.name?"disabled":""}>${e==="gate"?"Continue":"Save"}</button>
      </div>`,document.body.appendChild(this.overlay),this.setupEvents()}close(){this.overlay&&(this.overlay.remove(),this.overlay=null)}isOpen(){return this.overlay!==null}setupEvents(){document.getElementById("pe-close")?.addEventListener("click",()=>this.close());let t=document.getElementById("pe-avatar-input");if(t?.addEventListener("change",()=>{let e=t.files?.[0];if(!e)return;if(e.size>200*1024){alert("Image must be under 200KB");return}let i=new FileReader;i.onload=()=>{let n=i.result,s=document.getElementById("pe-avatar-preview");s&&(s.innerHTML=`<img src="${n}" alt="avatar">`)},i.readAsDataURL(e)}),this.mode==="gate"){let e=document.getElementById("pe-name"),i=document.getElementById("pe-save");e?.addEventListener("input",()=>{i.disabled=!e.value.trim()})}document.getElementById("pe-save")?.addEventListener("click",()=>{let e=document.getElementById("pe-name").value.trim(),i=document.getElementById("pe-phone").value.trim(),n=document.getElementById("pe-url").value.trim(),s=document.getElementById("pe-code").value.trim();if(this.mode==="gate"&&!e){document.getElementById("pe-name").focus();return}if(s&&!/^\d{4}$/.test(s)){document.getElementById("pe-code").focus();return}let I=document.querySelector("#pe-avatar-preview img")?.src||"";this.client.send({type:a.UPDATE_PROFILE,name:e,phone:i,url:n,avatar:I,...s?{secretCode:s}:{}})}),this.mode!=="gate"&&this.overlay?.addEventListener("click",e=>{e.target===this.overlay&&this.close()})}};var E=class{constructor(t){o(this,"client");o(this,"overlay",null);this.client=t}open(t){this.overlay&&this.close();let e=t.avatar&&t.avatar.startsWith("data:image")?`<img src="${t.avatar}" alt="${t.name}">`:'<span class="avatar-placeholder">?</span>';this.overlay=document.createElement("div"),this.overlay.className="profile-overlay",this.overlay.innerHTML=`
      <div class="profile-sheet user-sheet">
        <div class="sheet-handle"><div class="sheet-handle-bar"></div></div>
        <button class="profile-close" id="us-close">\u2715</button>
        <div class="user-sheet-avatar">${e}</div>
        <h3 class="user-sheet-name">${t.name||"Unknown"}</h3>
        <button id="us-vcard" class="btn btn-secondary user-sheet-btn">Download vCard</button>
        <button id="us-link" class="btn btn-primary user-sheet-btn" data-token="${t.playerToken}" data-name="${t.name}">Link Account</button>
      </div>`,document.body.appendChild(this.overlay),this.setupEvents(t)}close(){this.overlay&&(this.overlay.remove(),this.overlay=null)}setupEvents(t){document.getElementById("us-close")?.addEventListener("click",()=>this.close()),this.overlay?.addEventListener("click",n=>{n.target===this.overlay&&this.close()}),document.getElementById("us-vcard")?.addEventListener("click",()=>{this.downloadVCard(t)}),document.getElementById("us-link")?.addEventListener("click",()=>{let n=prompt(`Enter ${t.name}'s secret code to link accounts.
The code is a 4-digit number shown on their /profile page.
This cannot be undone.`);n&&t.playerToken&&(this.client.send({type:a.CONSOLIDATE,targetToken:t.playerToken,secretCode:n.trim()}),this.close())});let e=0,i=this.overlay?.querySelector(".user-sheet");i?.addEventListener("touchstart",n=>{e=n.touches[0].clientY},{passive:!0}),i?.addEventListener("touchmove",n=>{n.touches[0].clientY-e>50&&this.close()},{passive:!0})}downloadVCard(t){let e=["BEGIN:VCARD","VERSION:3.0",`FN:${t.name}`];if(t.phone&&e.push(`TEL:${t.phone}`),t.url&&e.push(`URL:${t.url}`),t.avatar&&t.avatar.startsWith("data:image")){let s=t.avatar.match(/^data:image\/(\w+);base64,(.+)$/);s&&e.push(`PHOTO;ENCODING=b;TYPE=${s[1].toUpperCase()}:${s[2]}`)}e.push("NOTE:RawBin User"),e.push("END:VCARD");let i=new Blob([e.join(`\r
`)],{type:"text/vcard"}),n=document.createElement("a");n.href=URL.createObjectURL(i),n.download=`${t.name.replace(/[^a-zA-Z0-9 ]/g,"")}.vcf`,n.click(),URL.revokeObjectURL(n.href)}};var v=class{constructor(t,e,i){o(this,"client");o(this,"container");o(this,"onLeave");o(this,"roomId","");o(this,"roomName","");o(this,"hostId","");o(this,"members",[]);o(this,"chatMessages",[]);o(this,"profileEditor");o(this,"profileSheet");this.client=t,this.container=e,this.onLeave=i,this.profileEditor=new d(t),this.profileSheet=new E(t),this.client.on(a.ROOM_JOINED,n=>{this.roomId=n.room.id,this.roomName=n.room.name,this.hostId=n.room.hostId,this.members=n.members||[],n.room.chatHistory&&(this.chatMessages=n.room.chatHistory.map(s=>({senderId:s.senderId,senderName:s.senderName,text:s.text}))),this.render()}),this.client.on(a.MEMBER_JOINED,n=>{n.member&&this.members.push(n.member),this.renderMemberList()}),this.client.on(a.MEMBER_LEFT,n=>{this.members=this.members.filter(s=>s.id!==n.memberId),this.renderMemberList()}),this.client.on(a.MEMBER_DISCONNECTED,n=>{this.renderMemberList()}),this.client.on(a.HOST_CHANGED,n=>{this.hostId=n.hostId,this.renderMemberList()}),this.client.on(a.CHAT_HISTORY,n=>{this.chatMessages=n.messages.map(s=>({senderId:s.senderId,senderName:s.senderName,text:s.text})),this.renderChatMessages()}),this.client.on(a.CHAT_MESSAGE,n=>{this.chatMessages.push({senderId:n.senderId,senderName:n.senderName,text:n.text}),this.appendChatMessage(n)}),this.client.on(a.ROOM_DELETED,()=>{this.onLeave()})}show(t){this.roomId=t,this.chatMessages=[],this.render()}hide(){this.container.innerHTML="",this.chatMessages=[],this.members=[]}render(){let t=this.members.some(e=>e.id===this.client.clientId&&this.hostId===this.client.clientId);this.container.innerHTML=`
      <div class="room-view">
        <div class="room-header">
          <button id="leave-btn" class="btn btn-back">\u2190 Leave</button>
          <h2 id="room-title">${this.roomName}</h2>
          <button id="invite-btn" class="btn btn-small">\u{1F517} Invite</button>
        </div>

        <div class="room-body">
          <div class="member-panel">
            <h3>Members</h3>
            <div id="member-list"></div>
          </div>

          <div class="chat-panel">
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-bar">
              <input type="text" id="chat-input" placeholder="Message..." maxlength="200" autocomplete="off">
              <button id="chat-send" class="btn btn-small btn-primary">Send</button>
            </div>
          </div>
        </div>

        ${t?`
        <div class="room-settings">
          <button id="delete-room-btn" class="btn btn-danger btn-small">Delete Room</button>
        </div>`:""}
      </div>`,this.renderMemberList(),this.renderChatMessages(),this.setupEvents()}setupEvents(){document.getElementById("leave-btn")?.addEventListener("click",()=>{this.client.leaveRoom(),this.onLeave()});let t=document.getElementById("invite-btn");t&&y(t,async()=>{let s=window.__shareBase||location.origin;await h(`${s}/app?join=${this.roomId}`,t,this.roomName)});let e=document.getElementById("chat-input"),i=document.getElementById("chat-send"),n=()=>{let s=e?.value.trim();s&&(this.client.sendChat(s),e.value="")};i?.addEventListener("click",n),e?.addEventListener("keydown",s=>{s.key==="Enter"&&n()}),document.getElementById("delete-room-btn")?.addEventListener("click",()=>{confirm("Delete this room permanently?")&&this.client.deleteRoom(this.roomId)})}renderMemberList(){let t=document.getElementById("member-list");t&&(t.innerHTML=this.members.map(e=>{let i=e.id===this.hostId,n=e.id===this.client.clientId;return`<div class="member-item${n?" member-self":""} member-clickable" data-member-id="${e.id}" data-member-token="${e.playerToken||""}">
        <span class="member-name">${e.name}${i?' <span class="host-badge">host</span>':""}${n?" (you)":""}</span>
      </div>`}).join(""),t.querySelectorAll(".member-clickable").forEach(e=>{e.addEventListener("click",()=>{let i=e.dataset.memberId,n=e.dataset.memberToken;if(i===this.client.clientId){let s=this.client.getProfile();this.profileEditor.open({name:s?.name||localStorage.getItem("rawbin-name")||"",phone:s?.phone||"",url:s?.url||"",avatar:s?.avatar||"",secretCode:s?.secretCode||""},"normal")}else if(n){let s=l=>{this.client.off(a.USER_INFO,s),l.profile&&this.profileSheet.open(l.profile)};this.client.on(a.USER_INFO,s),this.client.send({type:a.GET_USER_INFO,playerToken:n})}})}))}renderChatMessages(){let t=document.getElementById("chat-messages");if(t){t.innerHTML="";for(let e of this.chatMessages)t.appendChild(this.createChatBubble(e.senderId,e.senderName,e.text));t.scrollTop=t.scrollHeight}}appendChatMessage(t){let e=document.getElementById("chat-messages");e&&(e.appendChild(this.createChatBubble(t.senderId,t.senderName,t.text)),e.scrollTop=e.scrollHeight)}createChatBubble(t,e,i){let n=document.createElement("div");n.className=`chat-msg ${t===this.client.clientId?"chat-self":""}`;let s=document.createElement("span");s.className="chat-name",s.textContent=e;let l=document.createElement("span");return l.className="chat-text",l.textContent=i,n.appendChild(s),n.appendChild(l),n}};var c=new m,b=document.getElementById("app"),R=new d(c),u=new p(c,b,r=>{u.hide(),g.show(r)}),g=new v(c,b,()=>{g.hide(),u.show(),history.replaceState({},"","/app")});async function O(){try{return await(await fetch("/api/config")).json()}catch{return{baseDomain:location.hostname,httpsPort:parseInt(location.port)||4444}}}async function M(){try{let r=await O(),t=`https://${r.baseDomain}:${r.httpsPort}`;window.__shareBase=t,await c.connect();let e=await c.once(a.PROFILE);if(e?.profile?.profileCommitted)u.show();else{let i=e?.profile||{};R.open({name:i.name||"",phone:i.phone||"",url:i.url||"",avatar:i.avatar||"",secretCode:i.secretCode||""},"gate",()=>{u.show()})}}catch{b.innerHTML='<div class="error"><h2>Connection Failed</h2><p>Could not connect to server. Please refresh.</p></div>'}}M();
//# sourceMappingURL=app.js.map
