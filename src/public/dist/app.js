var I=Object.defineProperty;var T=(r,t,e)=>t in r?I(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var a=(r,t,e)=>T(r,typeof t!="symbol"?t+"":t,e);var s={CREATE_ROOM:"CREATE_ROOM",JOIN_ROOM:"JOIN_ROOM",LEAVE_ROOM:"LEAVE_ROOM",LIST_ROOMS:"LIST_ROOMS",DELETE_ROOM:"DELETE_ROOM",REMOVE_ROOM:"REMOVE_ROOM",CHAT_MESSAGE:"CHAT_MESSAGE",SPECTATE:"SPECTATE",LEAVE_SPECTATE:"LEAVE_SPECTATE",JOIN_ROOM_FROM_SPECTATE:"JOIN_ROOM_FROM_SPECTATE",IDENTIFY:"IDENTIFY",CONSOLIDATE:"CONSOLIDATE",UPDATE_SECRET_CODE:"UPDATE_SECRET_CODE",UPDATE_PROFILE:"UPDATE_PROFILE",GET_USER_INFO:"GET_USER_INFO",BUG_REPORT:"BUG_REPORT",PAIR_BUG_REPORT:"PAIR_BUG_REPORT",ROOM_LIST:"ROOM_LIST",ROOM_JOINED:"ROOM_JOINED",ROOM_LEFT:"ROOM_LEFT",ROOM_DELETED:"ROOM_DELETED",MEMBER_JOINED:"MEMBER_JOINED",MEMBER_LEFT:"MEMBER_LEFT",MEMBER_DISCONNECTED:"MEMBER_DISCONNECTED",HOST_CHANGED:"HOST_CHANGED",CHAT_HISTORY:"CHAT_HISTORY",SPECTATE_JOINED:"SPECTATE_JOINED",SPECTATE_LEFT:"SPECTATE_LEFT",SPECTATOR_JOINED:"SPECTATOR_JOINED",SPECTATOR_LEFT:"SPECTATOR_LEFT",SERVER_CONFIG:"SERVER_CONFIG",ERROR:"ERROR",PROFILE:"PROFILE",TOKEN_REDIRECT:"TOKEN_REDIRECT",CONSOLIDATE_OK:"CONSOLIDATE_OK",CONSOLIDATE_FAILED:"CONSOLIDATE_FAILED",SECRET_CODE_OK:"SECRET_CODE_OK",SECRET_CODE_FAILED:"SECRET_CODE_FAILED",PROFILE_UPDATED:"PROFILE_UPDATED",USER_INFO:"USER_INFO",BUG_REPORT_OK:"BUG_REPORT_OK",PAIR_OK:"PAIR_OK"};var c=class{constructor(){a(this,"ws",null);a(this,"handlers",new Map);a(this,"_profile",null);a(this,"clientId","");a(this,"connected",!1);a(this,"playerToken");a(this,"deviceId");let t=localStorage.getItem("rawbin-player-id");t||(t=crypto.randomUUID(),localStorage.setItem("rawbin-player-id",t)),this.playerToken=t;let e=localStorage.getItem("rawbin-device-id");e||(e=crypto.randomUUID(),localStorage.setItem("rawbin-device-id",e)),this.deviceId=e}isProfileCommitted(){return this._profile?.profileCommitted===!0}getProfile(){return this._profile}connect(){return new Promise((t,e)=>{let n=location.protocol==="https:"?"wss:":"ws:";this.ws=new WebSocket(`${n}//${location.host}`),this.ws.onopen=()=>{this.connected=!0,t()},this.ws.onclose=()=>{this.connected=!1,this.emit("disconnected",{})},this.ws.onerror=()=>e(new Error("WebSocket connection failed")),this.ws.onmessage=i=>{try{let o=JSON.parse(i.data);o.type==="welcome"&&(this.clientId=o.clientId,this.send({type:s.IDENTIFY,playerToken:this.playerToken,deviceId:this.deviceId,name:localStorage.getItem("rawbin-name")||"",avatar:localStorage.getItem("rawbin-avatar")||"",screenWidth:screen.width,screenHeight:screen.height,platform:navigator.platform})),o.type===s.TOKEN_REDIRECT&&o.newToken&&localStorage.setItem("rawbin-player-id",o.newToken),(o.type===s.PROFILE||o.type===s.PROFILE_UPDATED)&&o.profile&&(this._profile=o.profile),this.emit(o.type,o)}catch{}}})}async reconnect(){if(this.ws)try{this.ws.close()}catch{}this.ws=null,this.connected=!1,this.emit("reconnecting",{}),await this.connect(),this.emit("reconnected",{})}send(t){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(t))}on(t,e){this.handlers.has(t)||this.handlers.set(t,[]),this.handlers.get(t).push(e)}off(t,e){if(!e){this.handlers.delete(t);return}let n=this.handlers.get(t);n&&this.handlers.set(t,n.filter(i=>i!==e))}once(t){return new Promise(e=>{let n=i=>{this.off(t,n),e(i)};this.on(t,n)})}emit(t,e){this.handlers.get(t)?.forEach(n=>n(e))}createRoom(t,e,n,i){this.send({type:s.CREATE_ROOM,roomName:t,playerName:e,maxPlayers:n,roomKey:i,playerToken:this.playerToken})}joinRoom(t,e,n){this.send({type:s.JOIN_ROOM,roomId:t,playerName:e,roomKey:n,playerToken:this.playerToken})}leaveRoom(){this.send({type:s.LEAVE_ROOM})}listRooms(){this.send({type:s.LIST_ROOMS})}deleteRoom(t){this.send({type:s.DELETE_ROOM,roomId:t})}removeRoom(t){this.send({type:s.REMOVE_ROOM,roomId:t})}spectateRoom(t,e){this.send({type:s.SPECTATE,roomId:t,playerName:e})}leaveSpectate(){this.send({type:s.LEAVE_SPECTATE})}joinFromSpectate(t){this.send({type:s.JOIN_ROOM_FROM_SPECTATE,playerName:t})}sendChat(t){this.send({type:s.CHAT_MESSAGE,text:t})}sendBugReport(t){this.send({type:s.BUG_REPORT,text:t})}};function b(r,t){r.addEventListener("click",async()=>{if(!r.disabled){r.disabled=!0,r.classList.add("loading");try{await t()}finally{r.disabled=!1,r.classList.remove("loading")}}})}async function h(r,t,e){let n=e?` \u2014 ${e}`:"";if(navigator.share)try{await navigator.share({title:`RawBin${n}`,text:`Join my room on RawBin${n}`,url:r})}catch{}else try{await navigator.clipboard.writeText(`Join my RawBin room: ${r}${n}`)}catch{prompt("Copy this link:",r);return}if(t){let i=t.textContent;t.textContent="Shared!",setTimeout(()=>{t.textContent=i},2e3)}}var p=class{constructor(t,e,n){a(this,"client");a(this,"container");a(this,"rooms",[]);a(this,"memberName","");a(this,"onEnterRoom");this.client=t,this.container=e,this.onEnterRoom=n;let i=new URLSearchParams(window.location.search);this.memberName=i.get("name")||localStorage.getItem("rawbin-name")||`User ${Math.floor(Math.random()*1e3)}`,this.client.on(s.ROOM_LIST,l=>{this.rooms=l.rooms,this.renderRoomList()}),this.client.on(s.ROOM_JOINED,l=>{this.onEnterRoom(l.room.id)}),this.client.on(s.ERROR,l=>{this.showError(l.message)});let o=i.get("join");this.client.on("welcome",()=>{this.client.listRooms(),o&&this.client.joinRoom(o,this.memberName)})}show(){this.render(),this.client.listRooms()}hide(){this.container.innerHTML=""}render(){this.container.innerHTML=`
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
      </div>`,this.setupEvents()}setupEvents(){let t=document.getElementById("member-name");t?.addEventListener("change",()=>{this.memberName=t.value.trim()||"User",localStorage.setItem("rawbin-name",this.memberName)}),document.getElementById("create-room-btn")?.addEventListener("click",()=>{document.getElementById("create-form").style.display="block"}),document.getElementById("cancel-create-btn")?.addEventListener("click",()=>{document.getElementById("create-form").style.display="none"}),document.getElementById("confirm-create-btn")?.addEventListener("click",()=>{let e=document.getElementById("room-name").value||"My Room",n=parseInt(document.getElementById("room-max").value)||10,i=document.getElementById("room-key").value||void 0;this.client.createRoom(e,this.memberName,n,i)}),document.getElementById("refresh-rooms-btn")?.addEventListener("click",()=>{this.client.listRooms()}),document.getElementById("join-private-btn")?.addEventListener("click",()=>{let e=document.getElementById("join-room-id").value,n=document.getElementById("join-room-key").value||void 0;e&&this.client.joinRoom(e,this.memberName,n)})}renderRoomList(){let t=document.getElementById("room-list");if(t){if(this.rooms.length===0){t.innerHTML='<p class="no-rooms">No rooms available. Create one!</p>';return}t.innerHTML=this.rooms.map(e=>{let n=e.creatorId===this.client.playerToken,i=e.state==="archived"?"Archived":"Active";return`
        <div class="room-card" data-room-id="${e.id}">
          <div class="room-info">
            <span class="room-name">${e.isPrivate?"\u{1F512} ":""}${e.name}${n?' <span class="owner-badge">owner</span>':""}</span>
            <span class="room-members">${e.memberCount}/${e.maxMembers} members</span>
          </div>
          <div class="room-status">
            <span class="room-state room-state-${e.state}">${i}</span>
            <button class="btn btn-share" data-room="${e.id}" title="Copy join link">\u{1F517}</button>
            ${e.state==="active"?`<button class="btn btn-join" data-room="${e.id}">Join</button>`:""}
            ${e.state==="active"?`<button class="btn btn-spectate" data-room="${e.id}">Watch</button>`:""}
            ${n?`<button class="btn btn-delete" data-room="${e.id}" title="Delete room">\u2715</button>`:""}
          </div>
        </div>`}).join(""),t.querySelectorAll(".btn-join").forEach(e=>{e.addEventListener("click",()=>{this.client.joinRoom(e.dataset.room,this.memberName)})}),t.querySelectorAll(".btn-spectate").forEach(e=>{e.addEventListener("click",()=>{let n=e.dataset.room;this.client.spectateRoom(n,this.memberName),this.onEnterRoom(n)})}),t.querySelectorAll(".btn-share").forEach(e=>{e.addEventListener("click",async()=>{let n=e.dataset.room,i=window.__shareBase||location.origin;await h(`${i}/app?join=${n}`,e)})}),t.querySelectorAll(".btn-delete").forEach(e=>{e.addEventListener("click",()=>{let n=e.dataset.room;confirm("Delete this room?")&&this.client.deleteRoom(n)})})}}showError(t){let e=document.getElementById("lobby-error");e&&(e.textContent=t,e.style.display="block",setTimeout(()=>{e.style.display="none"},3e3))}};var d=class{constructor(t){a(this,"client");a(this,"overlay",null);a(this,"mode","normal");a(this,"onSave",null);this.client=t,this.client.on(s.PROFILE_UPDATED,e=>{this.onSave&&e.profile&&(this.onSave(e.profile),e.profile.name&&localStorage.setItem("rawbin-name",e.profile.name)),this.close()})}open(t={},e="normal",n){this.mode=e,this.onSave=n||null,this.overlay&&this.close(),this.overlay=document.createElement("div"),this.overlay.className=`profile-overlay ${e==="gate"?"profile-gate":""}`,this.overlay.innerHTML=`
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
      </div>`,document.body.appendChild(this.overlay),this.setupEvents()}close(){this.overlay&&(this.overlay.remove(),this.overlay=null)}isOpen(){return this.overlay!==null}setupEvents(){document.getElementById("pe-close")?.addEventListener("click",()=>this.close());let t=document.getElementById("pe-avatar-input");if(t?.addEventListener("change",()=>{let e=t.files?.[0];if(!e)return;if(e.size>200*1024){alert("Image must be under 200KB");return}let n=new FileReader;n.onload=()=>{let i=n.result,o=document.getElementById("pe-avatar-preview");o&&(o.innerHTML=`<img src="${i}" alt="avatar">`)},n.readAsDataURL(e)}),this.mode==="gate"){let e=document.getElementById("pe-name"),n=document.getElementById("pe-save");e?.addEventListener("input",()=>{n.disabled=!e.value.trim()})}document.getElementById("pe-save")?.addEventListener("click",()=>{let e=document.getElementById("pe-name").value.trim(),n=document.getElementById("pe-phone").value.trim(),i=document.getElementById("pe-url").value.trim(),o=document.getElementById("pe-code").value.trim();if(this.mode==="gate"&&!e){document.getElementById("pe-name").focus();return}if(o&&!/^\d{4}$/.test(o)){document.getElementById("pe-code").focus();return}let y=document.querySelector("#pe-avatar-preview img")?.src||"";this.client.send({type:s.UPDATE_PROFILE,name:e,phone:n,url:i,avatar:y,...o?{secretCode:o}:{}})}),this.mode!=="gate"&&this.overlay?.addEventListener("click",e=>{e.target===this.overlay&&this.close()})}};var E=class{constructor(t,e,n){a(this,"client");a(this,"container");a(this,"onLeave");a(this,"roomId","");a(this,"roomName","");a(this,"hostId","");a(this,"members",[]);a(this,"chatMessages",[]);a(this,"profileEditor");this.client=t,this.container=e,this.onLeave=n,this.profileEditor=new d(t),this.client.on(s.ROOM_JOINED,i=>{this.roomId=i.room.id,this.roomName=i.room.name,this.hostId=i.room.hostId,this.members=i.members||[],i.room.chatHistory&&(this.chatMessages=i.room.chatHistory.map(o=>({senderId:o.senderId,senderName:o.senderName,text:o.text}))),this.render()}),this.client.on(s.MEMBER_JOINED,i=>{i.member&&this.members.push(i.member),this.renderMemberList()}),this.client.on(s.MEMBER_LEFT,i=>{this.members=this.members.filter(o=>o.id!==i.memberId),this.renderMemberList()}),this.client.on(s.MEMBER_DISCONNECTED,i=>{this.renderMemberList()}),this.client.on(s.HOST_CHANGED,i=>{this.hostId=i.hostId,this.renderMemberList()}),this.client.on(s.CHAT_HISTORY,i=>{this.chatMessages=i.messages.map(o=>({senderId:o.senderId,senderName:o.senderName,text:o.text})),this.renderChatMessages()}),this.client.on(s.CHAT_MESSAGE,i=>{this.chatMessages.push({senderId:i.senderId,senderName:i.senderName,text:i.text}),this.appendChatMessage(i)}),this.client.on(s.ROOM_DELETED,()=>{this.onLeave()})}show(t){this.roomId=t,this.chatMessages=[],this.render()}hide(){this.container.innerHTML="",this.chatMessages=[],this.members=[]}render(){let t=this.members.some(e=>e.id===this.client.clientId&&this.hostId===this.client.clientId);this.container.innerHTML=`
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
      </div>`,this.renderMemberList(),this.renderChatMessages(),this.setupEvents()}setupEvents(){document.getElementById("leave-btn")?.addEventListener("click",()=>{this.client.leaveRoom(),this.onLeave()});let t=document.getElementById("invite-btn");t&&b(t,async()=>{let o=window.__shareBase||location.origin;await h(`${o}/app?join=${this.roomId}`,t,this.roomName)});let e=document.getElementById("chat-input"),n=document.getElementById("chat-send"),i=()=>{let o=e?.value.trim();o&&(this.client.sendChat(o),e.value="")};n?.addEventListener("click",i),e?.addEventListener("keydown",o=>{o.key==="Enter"&&i()}),document.getElementById("delete-room-btn")?.addEventListener("click",()=>{confirm("Delete this room permanently?")&&this.client.deleteRoom(this.roomId)})}renderMemberList(){let t=document.getElementById("member-list");t&&(t.innerHTML=this.members.map(e=>{let n=e.id===this.hostId,i=e.id===this.client.clientId;return`<div class="member-item${i?" member-self":""} member-clickable" data-member-id="${e.id}" data-member-token="${e.playerToken||""}">
        <span class="member-name">${e.name}${n?' <span class="host-badge">host</span>':""}${i?" (you)":""}</span>
      </div>`}).join(""),t.querySelectorAll(".member-clickable").forEach(e=>{e.addEventListener("click",()=>{if(e.dataset.memberId===this.client.clientId){let i=localStorage.getItem("rawbin-name")||"";this.profileEditor.open({name:i,phone:"",url:"",avatar:"",secretCode:""},"normal")}})}))}renderChatMessages(){let t=document.getElementById("chat-messages");if(t){t.innerHTML="";for(let e of this.chatMessages)t.appendChild(this.createChatBubble(e.senderId,e.senderName,e.text));t.scrollTop=t.scrollHeight}}appendChatMessage(t){let e=document.getElementById("chat-messages");e&&(e.appendChild(this.createChatBubble(t.senderId,t.senderName,t.text)),e.scrollTop=e.scrollHeight)}createChatBubble(t,e,n){let i=document.createElement("div");i.className=`chat-msg ${t===this.client.clientId?"chat-self":""}`;let o=document.createElement("span");o.className="chat-name",o.textContent=e;let l=document.createElement("span");return l.className="chat-text",l.textContent=n,i.appendChild(o),i.appendChild(l),i}};var m=new c,u=document.getElementById("app"),f=new d(m),v=new p(m,u,r=>{v.hide(),g.show(r)}),g=new E(m,u,()=>{g.hide(),v.show(),history.replaceState({},"","/app")});async function R(){try{return await(await fetch("/api/config")).json()}catch{return{baseDomain:location.hostname,httpsPort:parseInt(location.port)||4444}}}async function O(){try{let r=await R(),t=`https://${r.baseDomain}:${r.httpsPort}`;window.__shareBase=t,await m.connect();let e=await m.once(s.PROFILE);if(e?.profile?.profileCommitted)v.show();else{let n=e?.profile||{};f.open({name:n.name||"",phone:n.phone||"",url:n.url||"",avatar:n.avatar||"",secretCode:n.secretCode||""},"gate",()=>{v.show()})}}catch{u.innerHTML='<div class="error"><h2>Connection Failed</h2><p>Could not connect to server. Please refresh.</p></div>'}}O();
//# sourceMappingURL=app.js.map
