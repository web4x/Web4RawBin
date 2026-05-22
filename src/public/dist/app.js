var T=Object.defineProperty;var I=(a,e,t)=>e in a?T(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var r=(a,e,t)=>I(a,typeof e!="symbol"?e+"":e,t);var o={CREATE_ROOM:"CREATE_ROOM",JOIN_ROOM:"JOIN_ROOM",LEAVE_ROOM:"LEAVE_ROOM",LIST_ROOMS:"LIST_ROOMS",DELETE_ROOM:"DELETE_ROOM",REMOVE_ROOM:"REMOVE_ROOM",CHAT_MESSAGE:"CHAT_MESSAGE",SPECTATE:"SPECTATE",LEAVE_SPECTATE:"LEAVE_SPECTATE",JOIN_ROOM_FROM_SPECTATE:"JOIN_ROOM_FROM_SPECTATE",IDENTIFY:"IDENTIFY",CONSOLIDATE:"CONSOLIDATE",UPDATE_SECRET_CODE:"UPDATE_SECRET_CODE",BUG_REPORT:"BUG_REPORT",PAIR_BUG_REPORT:"PAIR_BUG_REPORT",ROOM_LIST:"ROOM_LIST",ROOM_JOINED:"ROOM_JOINED",ROOM_LEFT:"ROOM_LEFT",ROOM_DELETED:"ROOM_DELETED",MEMBER_JOINED:"MEMBER_JOINED",MEMBER_LEFT:"MEMBER_LEFT",MEMBER_DISCONNECTED:"MEMBER_DISCONNECTED",HOST_CHANGED:"HOST_CHANGED",CHAT_HISTORY:"CHAT_HISTORY",SPECTATE_JOINED:"SPECTATE_JOINED",SPECTATE_LEFT:"SPECTATE_LEFT",SPECTATOR_JOINED:"SPECTATOR_JOINED",SPECTATOR_LEFT:"SPECTATOR_LEFT",SERVER_CONFIG:"SERVER_CONFIG",ERROR:"ERROR",PROFILE:"PROFILE",TOKEN_REDIRECT:"TOKEN_REDIRECT",CONSOLIDATE_OK:"CONSOLIDATE_OK",CONSOLIDATE_FAILED:"CONSOLIDATE_FAILED",SECRET_CODE_OK:"SECRET_CODE_OK",SECRET_CODE_FAILED:"SECRET_CODE_FAILED",BUG_REPORT_OK:"BUG_REPORT_OK",PAIR_OK:"PAIR_OK"};var l=class{constructor(){r(this,"ws",null);r(this,"handlers",new Map);r(this,"clientId","");r(this,"connected",!1);r(this,"playerToken");r(this,"deviceId");let e=localStorage.getItem("rawbin-player-id");e||(e=crypto.randomUUID(),localStorage.setItem("rawbin-player-id",e)),this.playerToken=e;let t=localStorage.getItem("rawbin-device-id");t||(t=crypto.randomUUID(),localStorage.setItem("rawbin-device-id",t)),this.deviceId=t}connect(){return new Promise((e,t)=>{let s=location.protocol==="https:"?"wss:":"ws:";this.ws=new WebSocket(`${s}//${location.host}`),this.ws.onopen=()=>{this.connected=!0,e()},this.ws.onclose=()=>{this.connected=!1,this.emit("disconnected",{})},this.ws.onerror=()=>t(new Error("WebSocket connection failed")),this.ws.onmessage=n=>{try{let i=JSON.parse(n.data);i.type==="welcome"&&(this.clientId=i.clientId,this.send({type:o.IDENTIFY,playerToken:this.playerToken,deviceId:this.deviceId,name:localStorage.getItem("rawbin-name")||"",avatar:localStorage.getItem("rawbin-avatar")||"",screenWidth:screen.width,screenHeight:screen.height,platform:navigator.platform})),i.type===o.TOKEN_REDIRECT&&i.newToken&&localStorage.setItem("rawbin-player-id",i.newToken),this.emit(i.type,i)}catch{}}})}async reconnect(){if(this.ws)try{this.ws.close()}catch{}this.ws=null,this.connected=!1,this.emit("reconnecting",{}),await this.connect(),this.emit("reconnected",{})}send(e){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}on(e,t){this.handlers.has(e)||this.handlers.set(e,[]),this.handlers.get(e).push(t)}off(e,t){if(!t){this.handlers.delete(e);return}let s=this.handlers.get(e);s&&this.handlers.set(e,s.filter(n=>n!==t))}once(e){return new Promise(t=>{let s=n=>{this.off(e,s),t(n)};this.on(e,s)})}emit(e,t){this.handlers.get(e)?.forEach(s=>s(t))}createRoom(e,t,s,n){this.send({type:o.CREATE_ROOM,roomName:e,playerName:t,maxPlayers:s,roomKey:n,playerToken:this.playerToken})}joinRoom(e,t,s){this.send({type:o.JOIN_ROOM,roomId:e,playerName:t,roomKey:s,playerToken:this.playerToken})}leaveRoom(){this.send({type:o.LEAVE_ROOM})}listRooms(){this.send({type:o.LIST_ROOMS})}deleteRoom(e){this.send({type:o.DELETE_ROOM,roomId:e})}removeRoom(e){this.send({type:o.REMOVE_ROOM,roomId:e})}spectateRoom(e,t){this.send({type:o.SPECTATE,roomId:e,playerName:t})}leaveSpectate(){this.send({type:o.LEAVE_SPECTATE})}joinFromSpectate(e){this.send({type:o.JOIN_ROOM_FROM_SPECTATE,playerName:e})}sendChat(e){this.send({type:o.CHAT_MESSAGE,text:e})}sendBugReport(e){this.send({type:o.BUG_REPORT,text:e})}};function b(a,e){a.addEventListener("click",async()=>{if(!a.disabled){a.disabled=!0,a.classList.add("loading");try{await e()}finally{a.disabled=!1,a.classList.remove("loading")}}})}async function c(a,e,t){let s=t?` \u2014 ${t}`:"";if(navigator.share)try{await navigator.share({title:`RawBin${s}`,text:`Join my room on RawBin${s}`,url:a})}catch{}else try{await navigator.clipboard.writeText(`Join my RawBin room: ${a}${s}`)}catch{prompt("Copy this link:",a);return}if(e){let n=e.textContent;e.textContent="Shared!",setTimeout(()=>{e.textContent=n},2e3)}}var m=class{constructor(e,t,s){r(this,"client");r(this,"container");r(this,"rooms",[]);r(this,"memberName","");r(this,"onEnterRoom");this.client=e,this.container=t,this.onEnterRoom=s;let n=new URLSearchParams(window.location.search);this.memberName=n.get("name")||localStorage.getItem("rawbin-name")||`User ${Math.floor(Math.random()*1e3)}`,this.client.on(o.ROOM_LIST,d=>{this.rooms=d.rooms,this.renderRoomList()}),this.client.on(o.ROOM_JOINED,d=>{this.onEnterRoom(d.room.id)}),this.client.on(o.ERROR,d=>{this.showError(d.message)});let i=n.get("join");this.client.on("welcome",()=>{this.client.listRooms(),i&&this.client.joinRoom(i,this.memberName)})}show(){this.render(),this.client.listRooms()}hide(){this.container.innerHTML=""}render(){this.container.innerHTML=`
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
      </div>`,this.setupEvents()}setupEvents(){let e=document.getElementById("member-name");e?.addEventListener("change",()=>{this.memberName=e.value.trim()||"User",localStorage.setItem("rawbin-name",this.memberName)}),document.getElementById("create-room-btn")?.addEventListener("click",()=>{document.getElementById("create-form").style.display="block"}),document.getElementById("cancel-create-btn")?.addEventListener("click",()=>{document.getElementById("create-form").style.display="none"}),document.getElementById("confirm-create-btn")?.addEventListener("click",()=>{let t=document.getElementById("room-name").value||"My Room",s=parseInt(document.getElementById("room-max").value)||10,n=document.getElementById("room-key").value||void 0;this.client.createRoom(t,this.memberName,s,n)}),document.getElementById("refresh-rooms-btn")?.addEventListener("click",()=>{this.client.listRooms()}),document.getElementById("join-private-btn")?.addEventListener("click",()=>{let t=document.getElementById("join-room-id").value,s=document.getElementById("join-room-key").value||void 0;t&&this.client.joinRoom(t,this.memberName,s)})}renderRoomList(){let e=document.getElementById("room-list");if(e){if(this.rooms.length===0){e.innerHTML='<p class="no-rooms">No rooms available. Create one!</p>';return}e.innerHTML=this.rooms.map(t=>{let s=t.creatorId===this.client.playerToken,n=t.state==="archived"?"Archived":"Active";return`
        <div class="room-card" data-room-id="${t.id}">
          <div class="room-info">
            <span class="room-name">${t.isPrivate?"\u{1F512} ":""}${t.name}${s?' <span class="owner-badge">owner</span>':""}</span>
            <span class="room-members">${t.memberCount}/${t.maxMembers} members</span>
          </div>
          <div class="room-status">
            <span class="room-state room-state-${t.state}">${n}</span>
            <button class="btn btn-share" data-room="${t.id}" title="Copy join link">\u{1F517}</button>
            ${t.state==="active"?`<button class="btn btn-join" data-room="${t.id}">Join</button>`:""}
            ${t.state==="active"?`<button class="btn btn-spectate" data-room="${t.id}">Watch</button>`:""}
            ${s?`<button class="btn btn-delete" data-room="${t.id}" title="Delete room">\u2715</button>`:""}
          </div>
        </div>`}).join(""),e.querySelectorAll(".btn-join").forEach(t=>{t.addEventListener("click",()=>{this.client.joinRoom(t.dataset.room,this.memberName)})}),e.querySelectorAll(".btn-spectate").forEach(t=>{t.addEventListener("click",()=>{let s=t.dataset.room;this.client.spectateRoom(s,this.memberName),this.onEnterRoom(s)})}),e.querySelectorAll(".btn-share").forEach(t=>{t.addEventListener("click",async()=>{let s=t.dataset.room,n=window.__shareBase||location.origin;await c(`${n}/app?join=${s}`,t)})}),e.querySelectorAll(".btn-delete").forEach(t=>{t.addEventListener("click",()=>{let s=t.dataset.room;confirm("Delete this room?")&&this.client.deleteRoom(s)})})}}showError(e){let t=document.getElementById("lobby-error");t&&(t.textContent=e,t.style.display="block",setTimeout(()=>{t.style.display="none"},3e3))}};var h=class{constructor(e,t,s){r(this,"client");r(this,"container");r(this,"onLeave");r(this,"roomId","");r(this,"roomName","");r(this,"hostId","");r(this,"members",[]);r(this,"chatMessages",[]);this.client=e,this.container=t,this.onLeave=s,this.client.on(o.ROOM_JOINED,n=>{this.roomId=n.room.id,this.roomName=n.room.name,this.hostId=n.room.hostId,this.members=n.members||[],n.room.chatHistory&&(this.chatMessages=n.room.chatHistory.map(i=>({senderId:i.senderId,senderName:i.senderName,text:i.text}))),this.render()}),this.client.on(o.MEMBER_JOINED,n=>{n.member&&this.members.push(n.member),this.renderMemberList()}),this.client.on(o.MEMBER_LEFT,n=>{this.members=this.members.filter(i=>i.id!==n.memberId),this.renderMemberList()}),this.client.on(o.MEMBER_DISCONNECTED,n=>{this.renderMemberList()}),this.client.on(o.HOST_CHANGED,n=>{this.hostId=n.hostId,this.renderMemberList()}),this.client.on(o.CHAT_HISTORY,n=>{this.chatMessages=n.messages.map(i=>({senderId:i.senderId,senderName:i.senderName,text:i.text})),this.renderChatMessages()}),this.client.on(o.CHAT_MESSAGE,n=>{this.chatMessages.push({senderId:n.senderId,senderName:n.senderName,text:n.text}),this.appendChatMessage(n)}),this.client.on(o.ROOM_DELETED,()=>{this.onLeave()})}show(e){this.roomId=e,this.chatMessages=[],this.render()}hide(){this.container.innerHTML="",this.chatMessages=[],this.members=[]}render(){let e=this.members.some(t=>t.id===this.client.clientId&&this.hostId===this.client.clientId);this.container.innerHTML=`
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

        ${e?`
        <div class="room-settings">
          <button id="delete-room-btn" class="btn btn-danger btn-small">Delete Room</button>
        </div>`:""}
      </div>`,this.renderMemberList(),this.renderChatMessages(),this.setupEvents()}setupEvents(){document.getElementById("leave-btn")?.addEventListener("click",()=>{this.client.leaveRoom(),this.onLeave()});let e=document.getElementById("invite-btn");e&&b(e,async()=>{let i=window.__shareBase||location.origin;await c(`${i}/app?join=${this.roomId}`,e,this.roomName)});let t=document.getElementById("chat-input"),s=document.getElementById("chat-send"),n=()=>{let i=t?.value.trim();i&&(this.client.sendChat(i),t.value="")};s?.addEventListener("click",n),t?.addEventListener("keydown",i=>{i.key==="Enter"&&n()}),document.getElementById("delete-room-btn")?.addEventListener("click",()=>{confirm("Delete this room permanently?")&&this.client.deleteRoom(this.roomId)})}renderMemberList(){let e=document.getElementById("member-list");e&&(e.innerHTML=this.members.map(t=>{let s=t.id===this.hostId,n=t.id===this.client.clientId;return`<div class="member-item${n?" member-self":""}">
        <span class="member-name">${t.name}${s?' <span class="host-badge">host</span>':""}${n?" (you)":""}</span>
      </div>`}).join(""))}renderChatMessages(){let e=document.getElementById("chat-messages");if(e){e.innerHTML="";for(let t of this.chatMessages)e.appendChild(this.createChatBubble(t.senderId,t.senderName,t.text));e.scrollTop=e.scrollHeight}}appendChatMessage(e){let t=document.getElementById("chat-messages");t&&(t.appendChild(this.createChatBubble(e.senderId,e.senderName,e.text)),t.scrollTop=t.scrollHeight)}createChatBubble(e,t,s){let n=document.createElement("div");n.className=`chat-msg ${e===this.client.clientId?"chat-self":""}`;let i=document.createElement("span");i.className="chat-name",i.textContent=t;let d=document.createElement("span");return d.className="chat-text",d.textContent=s,n.appendChild(i),n.appendChild(d),n}};var E=new l,p=document.getElementById("app"),v=new m(E,p,a=>{v.hide(),y.show(a)}),y=new h(E,p,()=>{y.hide(),v.show(),history.replaceState({},"","/app")});async function O(){try{return await(await fetch("/api/config")).json()}catch{return{baseDomain:location.hostname,httpsPort:parseInt(location.port)||3443}}}async function R(){try{let a=await O(),e=`https://${a.baseDomain}:${a.httpsPort}`;window.__shareBase=e,await E.connect(),v.show()}catch{p.innerHTML='<div class="error"><h2>Connection Failed</h2><p>Could not connect to server. Please refresh.</p></div>'}}R();
//# sourceMappingURL=app.js.map
