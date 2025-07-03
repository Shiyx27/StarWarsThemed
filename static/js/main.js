class Photobooth {
  constructor(){
    this.filter = 'none';
    this.bind();
  }
  qs(sel){return document.querySelector(sel);}
  bind(){
    document.querySelectorAll('.filter').forEach(btn=>{
      btn.onclick=()=>this.setFilter(btn.dataset.filter);
    });
    this.qs('#capture').onclick = ()=>this.capture();
    this.qs('#generate').onclick = ()=>this.generate();
  }
  async setFilter(name){
    await fetch(`/set_filter/${name}`); this.filter=name;
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===name));
    this.qs('#status').innerText = name==='none'?'No filter':`Filter: ${name}`;
  }
  async capture(){
    const r = await fetch('/capture'); const j = await r.json();
    this.flash(); this.notify(j.status==='success'?'Saved!':'Error');
  }
  flash(){const f=document.createElement('div');f.style.cssText=
    'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;opacity:.8;z-index:9999';
    document.body.append(f); setTimeout(()=>f.remove(),150);
  }
  notify(msg){this.qs('#status').innerText=msg;}
  async generate(){
    const prompt=this.qs('#prompt').value.trim(); if(!prompt)return this.notify('Enter prompt');
    this.qs('#gen-status').innerText='Generating…';
    const r = await fetch('/generate_custom_filter',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
    const j=await r.json();
    if(j.status==='success'){this.setFilter(j.filter_name);this.notify('New filter ready');}
    else this.notify(j.message||'Failed');
    this.qs('#gen-status').innerText='';
  }
}
window.addEventListener('DOMContentLoaded',()=>new Photobooth());
