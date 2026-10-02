(() => {
  function rupiah(n){return Number(n)>0 ? new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n) : 'Hubungi admin';}
  function getCart(){
    if(Array.isArray(window.cart)) return window.cart.filter(x=>x&&Number(x.qty)>0);
    try{return JSON.parse(localStorage.getItem('palugada_cart')||'[]');}catch(e){return [];}
  }
  function itemTotal(x){return ((Number(x.price)||0)+(Array.isArray(x.addons)?x.addons.reduce((a,o)=>a+Number(o.price||0),0):0))*(Number(x.qty)||0);}
  function totalCart(){return getCart().reduce((s,x)=>s+itemTotal(x),0);}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

  function renderCheckout(){
    const cart=getCart();
    if(!cart.length){alert('Keranjang masih kosong. Pilih produk terlebih dahulu.');return false;}
    const summary=document.getElementById('checkoutSummary');
    if(!summary)return false;
    summary.innerHTML=`<div class="summary-box"><div style="font-weight:800;margin-bottom:8px">Ringkasan Pesanan</div>${cart.map(x=>`<div>• ${esc(x.name)} — ${x.qty}x — ${rupiah(itemTotal(x))}</div>`).join('')}<hr><strong>Total: ${rupiah(totalCart())}</strong></div>
      <div id="paymentChoice" style="margin-top:14px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04)">
        <div style="font-weight:800;margin-bottom:8px">Pilih Pembayaran</div>
        <label style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid rgba(255,255,255,.16);border-radius:12px;cursor:pointer">
          <input id="paymentQris" type="radio" name="paymentMethod" value="QRIS">
          <span><strong>QRIS</strong><br><small>Scan QRIS untuk pembayaran</small></span>
        </label>
      </div>
      <div id="qrisPaymentBox" style="display:none;margin-top:14px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#fff;text-align:center;color:#111;box-shadow:0 10px 30px rgba(0,0,0,.18)">
        <div style="font-weight:800;font-size:17px;margin-bottom:4px">Bayar via QRIS</div>
        <div style="font-size:12px;color:#555;margin-bottom:10px">PALUGADA SHOP30 • Scan QRIS di bawah</div>
        <img src="qris.svg?v=20261002qris2" alt="QRIS PALUGADA SHOP30" style="display:block;width:min(100%,330px);height:auto;margin:0 auto;border-radius:10px;image-rendering:auto">
        <div style="font-size:13px;color:#444;margin-top:10px">Total pembayaran: <strong>${rupiah(totalCart())}</strong></div>
        <div style="font-size:12px;color:#666;margin-top:5px">Setelah melakukan pembayaran, klik tombol Konfirmasi Order via WhatsApp.</div>
      </div>`;

    const btn=document.getElementById('checkoutBtn');
    if(btn){btn.textContent='Pilih pembayaran terlebih dahulu';btn.disabled=true;btn.style.opacity='.55';}
    const radio=document.getElementById('paymentQris');
    radio?.addEventListener('change',()=>{
      const box=document.getElementById('qrisPaymentBox');
      if(box)box.style.display=radio.checked?'block':'none';
      if(btn){btn.textContent='Konfirmasi Order via WhatsApp';btn.disabled=!radio.checked;btn.style.opacity=radio.checked?'1':'.55';}
    });

    document.getElementById('checkoutBackdrop').classList.add('show');
    document.body.classList.add('modal-open');
    return true;
  }

  function confirmOrder(){
    const cart=getCart();
    if(!cart.length){alert('Keranjang masih kosong.');return;}
    const payment=document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if(payment!=='QRIS'){alert('Pilih pembayaran QRIS terlebih dahulu.');return;}
    const name=document.getElementById('customerName').value.trim();
    const wa=document.getElementById('customerWa').value.trim();
    const note=document.getElementById('customerNote').value.trim();
    if(!name||!wa){alert('Isi nama dan nomor WhatsApp terlebih dahulu.');return;}
    const lines=cart.map(x=>'- '+x.name+' | '+(x.detail||'')+' | '+x.qty+'x | '+rupiah(itemTotal(x))).join('\n');
    const msg='Halo PALUGADA SHOP30, saya sudah melakukan pembayaran QRIS dan ingin konfirmasi order:\n\n'+lines+'\n\nTotal: '+rupiah(totalCart())+'\nPembayaran: QRIS\nNama: '+name+'\nWA: '+wa+(note?'\nCatatan: '+note:'');
    window.open('https://wa.me/6282319524232?text='+encodeURIComponent(msg),'_blank');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const review=document.getElementById('reviewOrderBtn');
    const confirm=document.getElementById('checkoutBtn');
    if(review)review.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();renderCheckout();},true);
    if(confirm)confirm.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!confirm.disabled)confirmOrder();},true);
  });
})();
