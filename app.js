(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var TOKEN=sessionStorage.getItem('stc_t'),U=null,CUR='dashboard',ST={},SKEW=0,TZ='Asia/Jakarta';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var F1=new Intl.DateTimeFormat('id-ID',{timeZone:TZ,dateStyle:'medium',timeStyle:'short'}),F2=new Intl.DateTimeFormat('id-ID',{timeZone:TZ,dateStyle:'full',timeStyle:'medium'});
function dt(ms){return ms?F1.format(new Date(Number(ms))):'-'}
var RP=new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0});
function now(){return Date.now()+SKEW}
function toast(m,e){var t=$('toast');t.textContent=m;t.className=e?'err show':'show';clearTimeout(toast.h);toast.h=setTimeout(function(){t.className=''},4500)}
function conn(s){$('conn').textContent=s}
function uuid(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)}

function api(a,p){
 p=p||{};p.action=a;p.token=TOKEN;conn('Memuat data...');
 if(!window.CFG||/GANTI/.test(CFG.API_URL))return Promise.reject(new Error('API_URL belum diisi di config.js.'));
 return fetch(CFG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(p)})
 .then(function(r){return r.json()},function(){conn('Gagal terhubung');throw new Error('Gagal terhubung ke server. Periksa koneksi lalu coba lagi.')})
 .then(function(j){conn('Terhubung');if(j.now)SKEW=j.now-Date.now();
  if(j.ok)return j.data;
  if(j.code==='AUTH'&&TOKEN){TOKEN=null;sessionStorage.removeItem('stc_t');showLogin()}
  throw new Error(j.message||'Gagal')});
}
function loadImg(img,kind,id){api('img',{kind:kind,id:id}).then(function(u){img.src=u}).catch(function(){img.alt='gagal'})}

/* ---- modal ---- */
function modal(h){$('mbox').innerHTML=h;$('modal').classList.remove('hidden')}
function closeM(){$('modal').classList.add('hidden');$('mbox').innerHTML=''}
$('modal').onclick=function(e){if(e.target===this)closeM()};

/* ---- definisi laporan ---- */
var WC=['Electrical','Mechanical','HVAC / AC','Plumbing','Audio','Projector','Building Maintenance','Preventive Maintenance','Corrective Maintenance','Lainnya'];
var WS=['Open','In Progress','Completed','Pending','Need Follow-up'];
var T={
 work:{label:'Laporan Pekerjaan',f:[['title','Judul pekerjaan','text',1],['category','Kategori','select',1,WC],['location','Lokasi','text',1],['date','Tanggal pekerjaan','date',1],['time','Jam pekerjaan','time'],['status','Status','select',1,WS],['desc','Deskripsi','textarea'],['note','Catatan','textarea']],team:1},
 meter:{label:'Laporan Meteran',f:[['kind','Jenis meteran','select',1,['Listrik','Air']],['location','Lokasi meteran','text',1],['meterNo','Nomor meteran','text',1],['date','Tanggal pencatatan','date',1],['time','Jam pencatatan','time',1],['reading','Angka pembacaan (kWh / m³)','number',1],['note','Catatan','textarea']]},
 purchase:{label:'Laporan Pembelian Barang',f:[['date','Tanggal pembelian','date',1],['time','Jam pembelian','time'],['store','Nama toko / pemasok','text',1],['buyer','Nama pembeli','text',1],['receiver','Nama penerima barang','text'],['purpose','Keperluan','text'],['note','Catatan','textarea']],items:1}
};
var FS=['Upcoming ATS','ATS Open','Coming Soon','Coming to Theater','Now Showing','Completed'];
var MENU=[['dashboard','Dashboard',0],['pengumuman','Pengumuman',0],['ats','Advanced Ticket Sales',0],['work','Laporan Pekerjaan',0],['meter','Laporan Meteran',0],['purchase','Laporan Pembelian',0],['pengguna','Manajemen Pengguna',1],['audit','Audit Log',1],['pengaturan','Pengaturan Sistem',1]];

/* ---- shell ---- */
function showLogin(){U=null;$('app').classList.add('hidden');$('login').classList.remove('hidden');$('lform').reset()}
function enter(u){U=u;$('hname').textContent=u.name;$('hrole').textContent=u.role;$('login').classList.add('hidden');$('app').classList.remove('hidden');
 if(u.mustChange){pwModal(true)}go('dashboard')}
function go(p){CUR=p;var adm=U.role==='ADMIN',h='';
 MENU.forEach(function(m){if(m[2]&&!adm)return;h+='<a data-p="'+m[0]+'" class="'+(p===m[0]?'on':'')+'">'+m[1]+'</a>'});
 $('nav').innerHTML=h;closeMenu();var v=$('view');v.innerHTML='<div class="empty">Memuat...</div>';
 ({dashboard:vDash,pengumuman:vAnn,ats:vAts,work:function(){vRep('work')},meter:function(){vRep('meter')},purchase:function(){vRep('purchase')},pengguna:vUsers,audit:vAudit,pengaturan:vSet})[p]()}
function closeMenu(){$('side').classList.remove('open');$('shade').classList.remove('open')}
$('nav').onclick=function(e){var a=e.target.closest('a');if(a)go(a.dataset.p)};
$('burger').onclick=function(){$('side').classList.add('open');$('shade').classList.add('open')};$('shade').onclick=closeMenu;
$('tp').onclick=function(){var p=$('p'),s=p.type==='password';p.type=s?'text':'password';this.textContent=s?'Sembunyikan':'Tampilkan'};
$('logout').onclick=function(){api('logout').catch(function(){});TOKEN=null;sessionStorage.removeItem('stc_t');showLogin()};
$('prof').onclick=function(){pwModal(false)};
setInterval(function(){$('clock').textContent=F2.format(new Date())+' WIB';tickCd()},1000);
function err(x){$('view').innerHTML='<div class="empty">'+esc(x.message)+'<br><br><button class="btn" id="retry">Coba lagi</button></div>';$('retry').onclick=function(){go(CUR)}}

$('lform').onsubmit=function(e){e.preventDefault();$('lerr').textContent='';var b=$('lbtn');b.disabled=true;b.textContent='Memproses...';
 api('login',{username:$('u').value.trim(),password:$('p').value}).then(function(r){TOKEN=r.token;sessionStorage.setItem('stc_t',TOKEN);enter(r.user)})
 .catch(function(x){$('lerr').textContent=x.message}).then(function(){b.disabled=false;b.textContent='Login'})};

function pwModal(force){
 modal('<h3>'+(force?'Ganti password awal':'Ganti password')+'</h3>'+(force?'<div class="info">Password awal harus diganti sebelum melanjutkan.</div>':'')+
 '<form id="pf"><label>Password lama</label><input id="po" type="password" required><label>Password baru (min. 8 karakter)</label><input id="pn" type="password" minlength="8" required>'+
 '<div class="merr" id="pe"></div><button class="btn" style="margin-top:10px">Simpan</button> '+(force?'':'<button type="button" class="btn sec" id="pc">Batal</button>')+'</form>');
 if(!force)$('pc').onclick=closeM;
 $('pf').onsubmit=function(e){e.preventDefault();api('changepw',{old:$('po').value,pw:$('pn').value}).then(function(){U.mustChange=false;closeM();toast('Password berhasil diganti.')}).catch(function(x){$('pe').textContent=x.message})}}

/* ---- dashboard ---- */
function vDash(){api('dashboard').then(function(d){
 var c=[['Laporan pekerjaan',d.work],['Laporan meteran',d.meter],['Laporan pembelian',d.purchase],['Laporan hari ini',d.today],['Film ATS mendatang',d.films],['Google Spreadsheet','Terhubung']];
 $('view').innerHTML='<h2>Dashboard</h2><div class="grid">'+c.map(function(x){return '<div class="card"><div class="n">'+x[1]+'</div><div class="l">'+x[0]+'</div></div>'}).join('')+'</div>'+
 '<h2 style="margin-top:24px">Pengumuman terbaru</h2>'+(d.announcements.length?d.announcements.map(annCard).join(''):'<div class="empty">Belum ada pengumuman.</div>')+
 '<h2 style="margin-top:24px">Aktivitas terbaru</h2>'+(d.recent.length?'<div class="scroll"><table><tr><th>No.</th><th>Kategori</th><th>Judul</th><th>Pelapor</th><th>Waktu</th><th></th></tr>'+
 d.recent.map(function(r){return '<tr><td>'+esc(r.id)+'</td><td>'+T[r.type].label+'</td><td>'+esc(r.title)+'</td><td>'+esc(r.reporter)+'</td><td>'+dt(r.createdAt)+'</td><td><button class="btn sec" data-d="'+r.id+'">Detail</button></td></tr>'}).join('')+'</table></div>':'<div class="empty">Belum ada laporan.</div>');
 document.querySelectorAll('[data-d]').forEach(function(b){b.onclick=function(){detail(b.dataset.d,function(){go('dashboard')})}})}).catch(err)}
function annCard(a){return '<div class="card" style="margin-bottom:10px"><b>'+esc(a.title)+'</b> <span class="pri '+esc(a.priority)+'">'+esc(a.priority)+'</span>'+(a.status!=='Aktif'?' <span class="pri">Diarsipkan</span>':'')+'<div style="white-space:pre-wrap;margin:6px 0">'+esc(a.body)+'</div><small>'+dt(a.publishedAt)+' · '+esc(a.createdBy)+'</small></div>'}

/* ---- pengumuman ---- */
function vAnn(){api('ann_list').then(function(l){var adm=U.role==='ADMIN';
 $('view').innerHTML='<h2>Pengumuman</h2>'+(adm?'<p><button class="btn" id="aa">+ Pengumuman</button></p>':'')+(l.length?l.map(function(a){return annCard(a)+(adm?'<p style="margin:-4px 0 12px"><button class="btn sec" data-e="'+a.id+'">Edit</button> <button class="btn sec" data-x="'+a.id+'">'+(a.status==='Aktif'?'Arsipkan':'Aktifkan')+'</button></p>':'')}).join(''):'<div class="empty">Belum ada pengumuman.</div>');
 if(!adm)return;$('aa').onclick=function(){annForm()};
 document.querySelectorAll('[data-e]').forEach(function(b){b.onclick=function(){annForm(l.filter(function(a){return a.id===b.dataset.e})[0])}});
 document.querySelectorAll('[data-x]').forEach(function(b){b.onclick=function(){api('ann_del',{id:b.dataset.x}).then(vAnn).catch(function(x){toast(x.message,1)})}})}).catch(err)}
function annForm(a){a=a||{};modal('<h3>'+(a.id?'Edit':'Tambah')+' pengumuman</h3><form id="af"><label>Judul *</label><input id="at" required value="'+esc(a.title)+'"><label>Isi *</label><textarea id="ab" rows="5" required>'+esc(a.body)+'</textarea><label>Prioritas</label><select id="ap">'+['Informasi','Penting','Mendesak'].map(function(o){return '<option'+(o===a.priority?' selected':'')+'>'+o+'</option>'}).join('')+'</select><div class="merr" id="ae"></div><button class="btn">Simpan</button> <button type="button" class="btn sec" id="ac">Batal</button></form>');
 $('ac').onclick=closeM;$('af').onsubmit=function(e){e.preventDefault();api('ann_save',{id:a.id,title:$('at').value,body:$('ab').value,priority:$('ap').value}).then(function(){closeM();toast('Pengumuman disimpan.');vAnn()}).catch(function(x){$('ae').textContent=x.message})}}

/* ---- ATS ---- */
function cdInfo(f){var n=now();if(f.status==='Completed'||f.status==='Now Showing')return null;
 if(f.atsAt&&n<f.atsAt&&f.status!=='ATS Open')return ['TIKET MULAI DIJUAL DALAM',f.atsAt];
 if(f.showAt&&n<f.showAt)return ['FILM TAYANG DALAM',f.showAt];return null}
function p2(n){return String(n).padStart(2,'0')}
function tickCd(){document.querySelectorAll('.cdl').forEach(function(e){var f=JSON.parse(e.dataset.f),i=cdInfo(f);
 if(!i){e.textContent=(f.atsAt||f.showAt)?'Waktu target tercapai. Status diperbarui Admin.':'Jadwal belum tersedia';return}
 var s=Math.max(0,Math.floor((i[1]-now())/1000));e.innerHTML='<small>'+i[0]+'</small><br>'+p2(Math.floor(s/86400))+' Hari : '+p2(Math.floor(s%86400/3600))+' Jam : '+p2(Math.floor(s%3600/60))+' Menit : '+p2(s%60)+' Detik'})}
function jk(ms){return ms?new Date(ms+7*3600000).toISOString().slice(0,16):''}
function vAts(){api('ats_list').then(function(l){var adm=U.role==='ADMIN';
 $('view').innerHTML='<h2>Advanced Ticket Sales</h2><div class="info">Informasi bukan jadwal resmi sampai dikonfirmasi Admin.</div>'+(adm?'<p><button class="btn" id="fa">+ Tambah film</button></p>':'')+
 (l.length?'<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">'+l.map(function(f){return '<div class="card film">'+(f.poster?'<img data-p="'+f.poster+'" alt="poster">':'<div class="noimg"></div>')+
 '<div><b>'+esc(f.title)+'</b><br><small>'+esc([f.genre,f.duration,f.rating].filter(Boolean).join(' · '))+'</small><br><span class="pri">'+esc(f.status)+'</span><br><small>ATS: '+dt(f.atsAt)+'<br>Tayang: '+dt(f.showAt)+'</small>'+(f.note?'<br><small>'+esc(f.note)+'</small>':'')+
 '<div class="cdl" data-f=\''+esc(JSON.stringify({status:f.status,atsAt:f.atsAt,showAt:f.showAt}))+'\'></div>'+(adm?'<button class="btn sec" data-e="'+f.id+'">Edit</button> <button class="btn sec" data-x="'+f.id+'">Hapus</button>':'')+'</div></div>'}).join('')+'</div>':'<div class="empty">Belum ada film ATS.</div>');
 document.querySelectorAll('img[data-p]').forEach(function(i){loadImg(i,'poster',i.dataset.p)});tickCd();if(!adm)return;
 $('fa').onclick=function(){filmForm()};
 document.querySelectorAll('[data-e]').forEach(function(b){b.onclick=function(){filmForm(l.filter(function(f){return f.id===b.dataset.e})[0])}});
 document.querySelectorAll('[data-x]').forEach(function(b){b.onclick=function(){if(confirm('Hapus film ini?'))api('ats_del',{id:b.dataset.x}).then(vAts).catch(function(x){toast(x.message,1)})}})}).catch(err)}
function filmForm(f){f=f||{};var poster=null;
 modal('<h3>'+(f.id?'Edit':'Tambah')+' film</h3><form id="ff"><label>Judul *</label><input id="ft" required value="'+esc(f.title)+'"><div class="row2"><div><label>Genre</label><input id="fg" value="'+esc(f.genre)+'"></div><div><label>Durasi</label><input id="fd" placeholder="120 menit" value="'+esc(f.duration)+'"></div><div><label>Klasifikasi usia</label><input id="fr" placeholder="13+" value="'+esc(f.rating)+'"></div><div><label>Status</label><select id="fs">'+FS.map(function(o){return '<option'+(o===f.status?' selected':'')+'>'+o+'</option>'}).join('')+'</select></div><div><label>Mulai ATS (WIB)</label><input type="datetime-local" id="fa1" value="'+jk(f.atsAt)+'"></div><div><label>Mulai tayang (WIB)</label><input type="datetime-local" id="fa2" value="'+jk(f.showAt)+'"></div></div><label>Poster (JPG/PNG/WebP)</label><input type="file" id="fp" accept="image/jpeg,image/png,image/webp"><label>Catatan</label><textarea id="fn" rows="2">'+esc(f.note)+'</textarea><div class="merr" id="fe"></div><button class="btn">Simpan</button> <button type="button" class="btn sec" id="fc">Batal</button></form>');
 $('fc').onclick=closeM;
 $('fp').onchange=function(){if(this.files[0])comp(this.files[0]).then(function(p){poster=p},function(){$('fe').textContent='Poster tidak valid.'})};
 var ms=function(v){return v?Date.parse(v+':00+07:00'):''};
 $('ff').onsubmit=function(e){e.preventDefault();api('ats_save',{id:f.id,title:$('ft').value,genre:$('fg').value,duration:$('fd').value,rating:$('fr').value,status:$('fs').value,atsAt:ms($('fa1').value),showAt:ms($('fa2').value),note:$('fn').value,poster:poster&&{mime:poster.mime,b64:poster.b64}})
 .then(function(){closeM();toast('Film disimpan.');vAts()}).catch(function(x){$('fe').textContent=x.message})}}

/* ---- foto ---- */
function comp(file){return new Promise(function(res,rej){
 if(['image/jpeg','image/png','image/webp'].indexOf(file.type)<0||file.size>15e6)return rej();
 var im=new Image(),u=URL.createObjectURL(file);im.onload=function(){var s=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);var url=c.toDataURL('image/jpeg',.8);res({mime:'image/jpeg',b64:url.split(',')[1],url:url})};im.onerror=rej;im.src=u})}

/* ---- laporan: daftar ---- */
function sum(t,r){var d=r.data;return t==='work'?esc(r.title)+'<br><small>'+esc(d.location)+' · '+esc(d.status)+'</small>':t==='meter'?esc(d.kind)+' – '+esc(d.location)+'<br><small>'+d.reading+' '+d.unit+(d.diff!=null?' (selisih '+d.diff+')':'')+'</small>':esc(d.store)+'<br><small>'+RP.format(d.total)+' · '+d.items.length+' barang</small>'}
function vRep(t){var s=ST[t]=ST[t]||{page:1,q:'',from:'',to:'',status:''},c=T[t];
 $('view').innerHTML='<h2>'+c.label+'</h2><div class="bar"><input id="rq" placeholder="Cari..." value="'+esc(s.q)+'"><input type="date" id="rf" value="'+s.from+'"><input type="date" id="rt" value="'+s.to+'">'+(t==='work'?'<select id="rs"><option value="">Semua status</option>'+WS.map(function(o){return '<option'+(o===s.status?' selected':'')+'>'+o+'</option>'}).join('')+'</select>':'')+'<button class="btn sec" id="rg">Cari</button><button class="btn" id="ra">+ Buat laporan</button></div><div id="rl" class="empty">Memuat...</div>';
 function load(){s.q=$('rq').value;s.from=$('rf').value;s.to=$('rt').value;s.status=$('rs')?$('rs').value:'';
  api('rep_list',{type:t,q:s.q,from:s.from,to:s.to,status:s.status,page:s.page}).then(function(r){
   $('rl').className='';$('rl').innerHTML=r.items.length?'<div class="scroll"><table><tr><th>No. Laporan</th><th>Waktu</th><th>Ringkasan</th><th>Pelapor</th><th>Aksi</th></tr>'+r.items.map(function(x){return '<tr><td>'+esc(x.id)+'</td><td>'+dt(x.createdAt)+'</td><td>'+sum(t,x)+'</td><td>'+esc(x.reporter)+'</td><td><button class="btn sec" data-d="'+x.id+'">Detail</button></td></tr>'}).join('')+'</table></div><div class="pg"><button class="btn sec" id="pp"'+(r.page<2?' disabled':'')+'>‹</button> Hal. '+r.page+' / '+Math.ceil(r.total/r.size)+' ('+r.total+') <button class="btn sec" id="pn"'+(r.page*r.size>=r.total?' disabled':'')+'>›</button></div>':'<div class="empty">Belum ada laporan.</div>';
   document.querySelectorAll('[data-d]').forEach(function(b){b.onclick=function(){detail(b.dataset.d,load)}});
   if($('pp')){$('pp').onclick=function(){s.page--;load()};$('pn').onclick=function(){s.page++;load()}}}).catch(function(x){$('rl').className='empty';$('rl').innerHTML=esc(x.message)+'<br><br><button class="btn" id="rr">Coba lagi</button>';$('rr').onclick=load})}
 $('rg').onclick=function(){s.page=1;load()};$('ra').onclick=function(){repForm(t,null,load)};load()}

/* ---- laporan: detail ---- */
function detail(id,after){modal('<div class="empty">Memuat...</div>');api('rep_get',{id:id}).then(function(r){var t=r.type,d=r.data,h='<h3>'+esc(r.id)+'</h3><table>';
 T[t].f.forEach(function(f){if(d[f[0]]!==''&&d[f[0]]!=null)h+='<tr><th>'+f[1]+'</th><td>'+esc(d[f[0]])+'</td></tr>'});
 if(t==='work')h+='<tr><th>Anggota tim</th><td>'+esc((d.team||[]).join(', ')||'-')+'</td></tr>';
 if(t==='meter')h+='<tr><th>Pembacaan sebelumnya</th><td>'+(d.prev!=null?d.prev+' '+d.unit:'Belum tersedia')+'</td></tr><tr><th>Selisih</th><td>'+(d.diff!=null?d.diff+' '+d.unit:'-')+'</td></tr>';
 h+='<tr><th>Pelapor</th><td>'+esc(r.reporter)+'</td></tr><tr><th>Dibuat</th><td>'+dt(r.createdAt)+'</td></tr><tr><th>Diubah</th><td>'+dt(r.updatedAt)+'</td></tr></table>';
 if(t==='purchase')h+='<div class="scroll"><table><tr><th>Barang</th><th>Jml</th><th>Harga</th><th>Total</th></tr>'+d.items.map(function(i){return '<tr><td>'+esc(i.name)+'<br><small>'+esc(i.category)+'</small></td><td>'+i.qty+' '+esc(i.unit)+'</td><td>'+RP.format(i.price)+'</td><td>'+RP.format(i.total)+'</td></tr>'}).join('')+'<tr><th colspan="3">Total transaksi</th><th>'+RP.format(d.total)+'</th></tr></table></div>';
 h+='<div class="ph" id="gal">'+r.photos.map(function(p){return '<div><img data-p="'+p+'" alt="foto"></div>'}).join('')+'</div>';
 var left=r.remainMs,t0=Date.now();
 if(U.role!=='ADMIN'&&r.own)h+=r.editable?'<div class="info">Anda dapat mengedit laporan ini selama 30 menit setelah laporan berhasil disimpan. Sisa: <b id="lf"></b></div>':'<div class="info">Batas waktu edit telah berakhir. Hubungi Admin jika diperlukan koreksi.</div>';
 h+='<p>'+(r.editable?'<button class="btn" id="de">Edit</button> ':'')+(U.role==='ADMIN'?'<button class="btn sec" id="dx">Arsipkan</button> ':'')+'<button class="btn sec" id="dc">Tutup</button></p>';
 modal(h);$('dc').onclick=closeM;
 document.querySelectorAll('#gal img').forEach(function(i){loadImg(i,'photo',i.dataset.p);i.onclick=function(){if(i.src)window.open(i.src)}});
 if($('lf')){var iv=setInterval(function(){var m=left-(Date.now()-t0);if(!$('lf')||m<=0){clearInterval(iv);if($('de')&&U.role!=='ADMIN')$('de').disabled=true;if($('lf'))$('lf').textContent='habis';return}$('lf').textContent=p2(Math.floor(m/60000))+':'+p2(Math.floor(m/1000)%60)},1000)}
 if($('de'))$('de').onclick=function(){repForm(t,r,after)};
 if($('dx'))$('dx').onclick=function(){var why=prompt('Arsipkan '+r.id+' ('+T[t].label+')? Alasan:');if(why===null)return;api('rep_del',{id:r.id,reason:why}).then(function(){closeM();toast('Laporan diarsipkan.');after&&after()}).catch(function(x){toast(x.message,1)})}
 }).catch(function(x){closeM();toast(x.message,1)})}

/* ---- laporan: form ---- */
function fld(f,v){var k=f[0],q=f[3]?' required':'',h='<label>'+f[1]+(f[3]?' *':'')+'</label>',v2=v==null?'':v;
 if(f[2]==='select')return h+'<select name="'+k+'"'+q+'>'+f[4].map(function(o){return '<option'+(o===v2?' selected':'')+'>'+esc(o)+'</option>'}).join('')+'</select>';
 if(f[2]==='textarea')return h+'<textarea name="'+k+'" rows="3">'+esc(v2)+'</textarea>';
 return h+'<input name="'+k+'" type="'+f[2]+'"'+(f[2]==='number'?' step="any" min="0"':'')+' value="'+esc(v2)+'"'+q+'>'}
function irow(i){i=i||{};return '<div class="irow"><input class="in" placeholder="Nama barang" value="'+esc(i.name)+'"><input class="ic" placeholder="Kategori" value="'+esc(i.category)+'"><input class="iq" type="number" step="any" min="0" placeholder="Jml" value="'+(i.qty||'')+'"><input class="iu" placeholder="Satuan" value="'+esc(i.unit)+'"><input class="ip" type="number" step="any" min="0" placeholder="Harga satuan" value="'+(i.price==null?'':i.price)+'"><b class="it"></b><button type="button" class="btn sec rm">×</button></div>'}
function repForm(t,rec,after){var c=T[t],d=rec?rec.data:{},PH=[],rid=uuid(),team=[];
 var go2=function(){
  var h='<h3>'+(rec?'Edit '+esc(rec.id):'Buat '+c.label)+'</h3><form id="rfm"><div class="row2">'+c.f.map(function(f){return '<div>'+fld(f,d[f[0]]!=null?d[f[0]]:(f[0]==='date'?new Date(now()+7*36e5).toISOString().slice(0,10):f[0]==='time'?new Date(now()+7*36e5).toISOString().slice(11,16):''))+'</div>'}).join('')+'</div>';
  if(c.team)h+='<label>Anggota tim yang mengerjakan</label><div id="tm">'+team.map(function(n){return '<label style="font-weight:400;margin:4px 0"><input type="checkbox" style="width:auto;min-height:0" value="'+esc(n)+'"'+((d.team||[]).indexOf(n)>=0?' checked':'')+'> '+esc(n)+'</label>'}).join('')+'</div>';
  if(c.items)h+='<label>Barang *</label><div id="its">'+(d.items||[{}]).map(irow).join('')+'</div><button type="button" class="btn sec" id="ai">+ Tambah Barang</button><p><b>Total transaksi: <span id="gt">Rp 0</span></b></p>';
  h+='<label>Foto dokumentasi (JPG/PNG/WebP, maks 10)</label><input type="file" id="fi" accept="image/jpeg,image/png,image/webp" multiple><div class="ph" id="pv"></div><div class="merr" id="re"></div><button class="btn" id="rs">Simpan</button> <button type="button" class="btn sec" id="rc">Batal</button></form>';
  modal(h);$('rc').onclick=closeM;
  function calc(){var g=0;document.querySelectorAll('.irow').forEach(function(r){var tt=Math.round((+r.querySelector('.iq').value||0)*(+r.querySelector('.ip').value||0));g+=tt;r.querySelector('.it').textContent=RP.format(tt)});if($('gt'))$('gt').textContent=RP.format(g)}
  if(c.items){$('its').oninput=calc;$('its').onclick=function(e){if(e.target.classList.contains('rm')&&document.querySelectorAll('.irow').length>1){e.target.parentNode.remove();calc()}};$('ai').onclick=function(){$('its').insertAdjacentHTML('beforeend',irow())};calc()}
  function prev(){$('pv').innerHTML=PH.map(function(p,i){return '<div><img src="'+p.url+'"><button type="button" class="x" data-i="'+i+'">×</button></div>'}).join('')}
  $('pv').onclick=function(e){if(e.target.dataset.i!=null){PH.splice(+e.target.dataset.i,1);prev()}};
  $('fi').onchange=function(){var fs=[].slice.call(this.files),bad=0;this.value='';
   fs.reduce(function(p,f){return p.then(function(){if(PH.length>=10){bad++;return}return comp(f).then(function(x){PH.push(x)},function(){bad++})})},Promise.resolve()).then(function(){prev();$('re').textContent=bad?bad+' file ditolak (format/ukuran tidak valid atau melebihi 10 foto).':''})};
  $('rfm').onsubmit=function(e){e.preventDefault();var f=e.target,data={};
   c.f.forEach(function(x){data[x[0]]=f.elements[x[0]].value});
   if(c.team)data.team=[].map.call(document.querySelectorAll('#tm input:checked'),function(i){return i.value});
   if(c.items)data.items=[].map.call(document.querySelectorAll('.irow'),function(r){return {name:r.querySelector('.in').value,category:r.querySelector('.ic').value,qty:r.querySelector('.iq').value,unit:r.querySelector('.iu').value,price:r.querySelector('.ip').value}});
   var b=$('rs');b.disabled=true;b.textContent='Menyimpan...';$('re').textContent='';
   api('rep_save',{type:t,id:rec&&rec.id,reqId:rid,data:data,photos:PH.map(function(p){return {mime:p.mime,b64:p.b64}})}).then(function(r){closeM();toast(r.photoFailed?'Laporan tersimpan, '+r.photoFailed+' foto gagal diunggah.':'Laporan berhasil disimpan: '+r.id,!!r.photoFailed);after&&after()})
   .catch(function(x){$('re').textContent=x.message+' Isian Anda tidak dihapus; silakan coba lagi.';b.disabled=false;b.textContent='Simpan'})}};
 if(c.team)api('team').then(function(n){team=n;go2()}).catch(function(x){toast(x.message,1)});else go2()}

/* ---- pengguna, audit, pengaturan ---- */
function vUsers(){api('usr_list').then(function(l){
 $('view').innerHTML='<h2>Manajemen Pengguna</h2><div class="bar"><input id="uq" placeholder="Cari nama/username"><button class="btn" id="ua">+ Akun baru</button></div><div class="scroll"><table id="ut"></table></div>';
 function draw(){var q=$('uq').value.toLowerCase();$('ut').innerHTML='<tr><th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr>'+l.filter(function(u){return (u.fullName+' '+u.username).toLowerCase().indexOf(q)>=0}).map(function(u){return '<tr><td>'+esc(u.fullName)+'</td><td>'+esc(u.username)+'</td><td>'+u.role+'</td><td>'+u.status+'</td><td><button class="btn sec" data-e="'+u.userId+'">Edit</button> <button class="btn sec" data-r="'+u.userId+'">Reset PW</button></td></tr>'}).join('');
  document.querySelectorAll('[data-e]').forEach(function(b){b.onclick=function(){uForm(l.filter(function(u){return u.userId===b.dataset.e})[0])}});
  document.querySelectorAll('[data-r]').forEach(function(b){b.onclick=function(){var p=prompt('Password sementara baru (min. 8 karakter):');if(p)api('usr_reset',{userId:b.dataset.r,password:p}).then(function(){toast('Password direset. Pengguna wajib menggantinya saat login.')}).catch(function(x){toast(x.message,1)})}})}
 $('uq').oninput=draw;$('ua').onclick=function(){uForm()};draw()}).catch(err)}
function uForm(u){var n=!u;u=u||{};modal('<h3>'+(n?'Akun baru':'Edit akun')+'</h3><form id="uf"><label>Nama lengkap *</label><input id="un" required value="'+esc(u.fullName)+'">'+(n?'<label>Username *</label><input id="uu" required><label>Password sementara * (min. 8)</label><input id="up" type="password" minlength="8" required>':'')+'<label>Role</label><select id="ur"><option'+(u.role==='USER'?' selected':'')+'>USER</option><option'+(u.role==='ADMIN'?' selected':'')+'>ADMIN</option></select>'+(n?'':'<label>Status</label><select id="us"><option'+(u.status==='Aktif'?' selected':'')+'>Aktif</option><option'+(u.status==='Nonaktif'?' selected':'')+'>Nonaktif</option></select>')+'<div class="merr" id="ue"></div><button class="btn">Simpan</button> <button type="button" class="btn sec" id="uc">Batal</button></form>');
 $('uc').onclick=closeM;$('uf').onsubmit=function(e){e.preventDefault();api('usr_save',{userId:u.userId,fullName:$('un').value,username:n&&$('uu').value,password:n&&$('up').value,role:$('ur').value,status:n?'Aktif':$('us').value}).then(function(){closeM();toast('Akun disimpan.');vUsers()}).catch(function(x){$('ue').textContent=x.message})}}
function vAudit(){var pg=1;(function load(){api('audit',{page:pg}).then(function(r){$('view').innerHTML='<h2>Audit Log</h2><div class="scroll"><table><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Kategori</th><th>Record</th><th>Ringkasan</th></tr>'+r.items.map(function(x){return '<tr><td>'+dt(x.at)+'</td><td>'+esc(x.userName)+' ('+x.role+')</td><td>'+esc(x.action)+'</td><td>'+esc(x.category)+'</td><td>'+esc(x.recordId)+'</td><td>'+esc(x.summary)+'</td></tr>'}).join('')+'</table></div><div class="pg"><button class="btn sec" id="ap"'+(pg<2?' disabled':'')+'>‹</button> Hal. '+pg+' / '+Math.max(1,Math.ceil(r.total/r.size))+' <button class="btn sec" id="an"'+(pg*r.size>=r.total?' disabled':'')+'>›</button></div>';
  $('ap').onclick=function(){pg--;load()};$('an').onclick=function(){pg++;load()}}).catch(err)})()}
function vSet(){api('dashboard').then(function(){$('view').innerHTML='<h2>Pengaturan Sistem</h2><div class="card"><b>Integrasi</b><p>Google Apps Script: terhubung<br>Google Spreadsheet: terhubung (dashboard berhasil membaca data)<br>Zona waktu: Asia/Jakarta</p><p>Pengelolaan akun ada di menu Manajemen Pengguna. Ganti password lewat tombol Profil.</p></div>'}).catch(err)}

/* ---- mulai ---- */
if(TOKEN)api('me').then(enter).catch(function(){showLogin()});
})();
