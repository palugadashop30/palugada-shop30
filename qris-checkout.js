(() => {
  function rupiah(n){return n ? new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n) : 'Hubungi admin';}
  function totalCart(){return (window.cart||[]).reduce((s,x)=>s+((Number(x.price)||0)+(x.addons||[]).reduce((a,o)=>a+Number(o.price||0),0))*(Number(x.qty)||0),0);}
  function ensureQrisBox(){
    const summary=document.getElementById('checkoutSummary');
    if(!summary || document.getElementById('qrisPaymentBox')) return;
    const box=document.createElement('div');
    box.id='qrisPaymentBox';
    box.style.cssText='margin-top:14px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#fff;text-align:center;color:#111;box-shadow:0 10px 30px rgba(0,0,0,.18)';
    box.innerHTML='<div style="font-weight:800;font-size:16px;margin-bottom:4px">Bayar via QRIS</div><div style="font-size:12px;color:#555;margin-bottom:10px">PALUGADA SHOP30 • Scan QRIS di bawah</div><img src="qris.svg?v=20261002qris" alt="QRIS PALUGADA SHOP30" style="display:block;width:min(100%,330px);height:auto;margin:0 auto;border-radius:10px"><div style="font-size:13px;color:#444;margin-top:10px">Total pembayaran: <strong>'+rupiah(totalCart())+'</strong></div><div style="font-size:12px;color:#666;margin-top:5px">Setelah pembayaran, klik tombol Konfirmasi Order.</div>';
    summary.appendChild(box);
  }
  function openCheckoutQris(){
    if(!window.cart || !window.cart.length){alert('Keranjang masih kosong.');return;}
    const summary=document.getElementById('checkoutSummary');
    summary.innerHTML='<div class="summary-box">'+window.cart.map(x=>'<div>• '+String(x.name||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))+' — '+x.qty+'x — '+rupiah(((Number(x.price)||0)+(x.addons||[]).reduce((a,o)=>a+Number(o.price||0),0))*x.qty)+'</div>').join('')+'<hr><strong>Total: '+rupiah(totalCart())+'</strong></div>';
    ensureQrisBox();
    document.getElementById('checkoutBtn').textContent='Konfirmasi Order via WhatsApp';
    document.getElementById('checkoutBackdrop').classList.add('show');
    document.body.classList.add('modal-open');
  }
  function confirmOrder(){
    if(!window.cart || !window.cart.length){alert('Keranjang masih kosong.');return;}
    const name=document.getElementById('customerName').value.trim();
    const wa=document.getElementById('customerWa').value.trim();
    const note=document.getElementById('customerNote').value.trim();
    if(!name||!wa){alert('Isi nama dan nomor WhatsApp terlebih dahulu.');return;}
    const lines=window.cart.map(x=>'- '+x.name+' | '+(x.detail||'')+' | '+x.qty+'x | '+rupiah(((Number(x.price)||0)+(x.addons||[]).reduce((a,o)=>a+Number(o.price||0),0))*x.qty)).join('\n');
    const total=rupiah(totalCart());
    const msg='Halo PALUGADA SHOP30, saya sudah melakukan pembayaran QRIS dan ingin konfirmasi order:\n\n'+lines+'\n\nTotal: '+total+'\nNama: '+name+'\nWA: '+wa+(note?'\nCatatan: '+note:'');
    window.open('https://wa.me/6282319524232?text='+encodeURIComponent(msg),'_blank');
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const review=document.getElementById('reviewOrderBtn');
    const confirm=document.getElementById('checkoutBtn');
    if(review) review.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCheckoutQris();},true);
    if(confirm) confirm.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();confirmOrder();},true);
  });
})();
