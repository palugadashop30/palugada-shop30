(() => {
  const money=n=>Number(n)>0?new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n):'Hubungi admin';
  const cart=()=>Array.isArray(window.cart)?window.cart.filter(x=>x&&Number(x.qty)>0):[];
  const itemTotal=x=>((Number(x.price)||0)+(x.addons||[]).reduce((s,a)=>s+Number(a.price||0),0))*(Number(x.qty)||0);
  const total=()=>cart().reduce((s,x)=>s+itemTotal(x),0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function openCheckout(){
    const items=cart(); if(!items.length){alert('Keranjang masih kosong. Pilih produk terlebih dahulu.');return;}
    const summary=document.getElementById('checkoutSummary');
    const form=document.querySelector('#checkoutBackdrop .checkout-form');
    if(!summary||!form)return;
    summary.innerHTML=`<div class="summary-box"><b>Ringkasan Pesanan</b>${items.map(x=>`<div>• ${esc(x.name)} — ${x.qty}x — ${money(itemTotal(x))}</div>`).join('')}<hr><strong>Total: ${money(total())}</strong></div>`;
    let area=document.getElementById('paymentArea');
    if(!area){area=document.createElement('div');area.id='paymentArea';form.insertAdjacentElement('afterend',area);}
    area.innerHTML=`<div style="margin-top:14px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04)"><b>Pilih Pembayaran</b><label style="display:flex;align-items:center;gap:10px;margin-top:10px;padding:12px;border:1px solid rgba(255,255,255,.16);border-radius:12px"><input id="paymentQris" type="radio" name="paymentMethod" value="QRIS"><span><strong>QRIS</strong><br><small>Scan QRIS untuk pembayaran</small></span></label></div><div id="qrisPaymentBox" style="display:none;margin-top:14px;padding:14px;border-radius:18px;background:#fff;text-align:center;color:#111"><b>Bayar via QRIS</b><div style="font-size:12px;color:#555;margin:5px 0 10px">PALUGADA SHOP30 • Scan QRIS di bawah</div><img src="qris.svg?v=20261002qris3" alt="QRIS PALUGADA SHOP30" style="display:block;width:min(100%,330px);height:auto;margin:auto"><div style="margin-top:10px">Total pembayaran: <strong>${money(total())}</strong></div><small style="color:#666">Setelah pembayaran, klik Konfirmasi Order via WhatsApp.</small></div>`;
    const btn=document.getElementById('checkoutBtn'); btn.textContent='Pilih QRIS terlebih dahulu';btn.disabled=true;btn.style.opacity='.55';
    document.getElementById('paymentQris').onchange=()=>{document.getElementById('qrisPaymentBox').style.display='block';btn.textContent='Konfirmasi Order via WhatsApp';btn.disabled=false;btn.style.opacity='1';};
    document.getElementById('checkoutBackdrop').classList.add('show');document.body.classList.add('modal-open');
  }
  function confirmOrder(){
    if(!cart().length)return alert('Keranjang masih kosong.');
    if(document.querySelector('input[name="paymentMethod"]:checked')?.value!=='QRIS')return alert('Pilih pembayaran QRIS terlebih dahulu.');
    const name=document.getElementById('customerName').value.trim(),wa=document.getElementById('customerWa').value.trim(),note=document.getElementById('customerNote').value.trim();
    if(!name||!wa)return alert('Isi nama dan nomor WhatsApp terlebih dahulu.');
    const lines=cart().map(x=>`- ${x.name} | ${x.qty}x | ${money(itemTotal(x))}`).join('\n');
    const msg=`Halo PALUGADA SHOP30, saya sudah melakukan pembayaran QRIS dan ingin konfirmasi order:\n\n${lines}\n\nTotal: ${money(total())}\nPembayaran: QRIS\nNama: ${name}\nWA: ${wa}${note?'\nCatatan: '+note:''}`;
    window.open('https://wa.me/6282319524232?text='+encodeURIComponent(msg),'_blank');
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const r=document.getElementById('reviewOrderBtn'),b=document.getElementById('checkoutBtn');
    if(r)r.onclick=e=>{e.preventDefault();openCheckout();};
    if(b)b.onclick=e=>{e.preventDefault();if(!b.disabled)confirmOrder();};
  });
})();
