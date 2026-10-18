(() => {
  const money=n=>Number(n)>0?new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n):'Hubungi admin';
  const cart=()=>Array.isArray(window.cart)?window.cart.filter(x=>x&&Number(x.qty)>0):[];
  const itemTotal=x=>((Number(x.price)||0)+(Array.isArray(x.addons)?x.addons.reduce((s,a)=>s+Number(a.price||0),0):0))*(Number(x.qty)||0);
  const total=()=>cart().reduce((s,x)=>s+itemTotal(x),0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function openCheckout(){
    const items=cart();
    if(!items.length){alert('Keranjang masih kosong. Pilih produk terlebih dahulu.');return;}
    const summary=document.getElementById('checkoutSummary');
    const form=document.querySelector('#checkoutBackdrop .checkout-form');
    if(!summary||!form)return;

    summary.innerHTML=`<div class="summary-box"><b>Ringkasan Pesanan</b>${items.map(x=>`<div style="padding:8px 0;border-bottom:1px solid #eef0f3"><b>• ${esc(x.name)}</b><br>Jumlah: ${Number(x.qty)||0}x<br>Harga dasar: ${money(x.price)}${Array.isArray(x.addons)&&x.addons.length?`<br>Tambahan / topping:${x.addons.map(a=>`<br>＋ ${esc(a.name)}: +${money(a.price)}${Number(x.qty)>1?` per item (total ${money((Number(a.price)||0)*(Number(x.qty)||0))})`:''}`).join('')}`:'<br>Tambahan / topping: Tidak ada'}<br><b>Total produk: ${money(itemTotal(x))}</b></div>`).join('')}<hr><strong>Total: ${money(total())}</strong></div>`;

    let area=document.getElementById('paymentArea');
    if(!area){area=document.createElement('div');area.id='paymentArea';form.insertAdjacentElement('afterend',area);}
    area.innerHTML=`
      <div class="payment-choice">
        <b>Pilih Pembayaran</b>
        <label class="payment-option">
          <input id="paymentQris" type="radio" name="paymentMethod" value="QRIS">
          <span><strong>QRIS</strong><br><small>Gunakan QRIS untuk pembayaran</small></span>
        </label>
      </div>
      <div id="qrisPaymentBox" class="qris-box" hidden>
        <div class="qris-title">Pembayaran QRIS</div>
        <div class="qris-store">PALUGADA SHOP30</div>
        <img src="qris.svg?v=20261002qris4" alt="QRIS PALUGADA SHOP30">
        <div class="qris-total">Total pembayaran: ${money(total())}</div>
        <div class="qris-note">Setelah melakukan pembayaran, klik <b>Konfirmasi Order</b> untuk mengirim pesanan ke WhatsApp.</div>
      </div>`;

    const btn=document.getElementById('checkoutBtn');
    btn.textContent='Pilih QRIS terlebih dahulu';
    btn.disabled=true;
    btn.style.opacity='.55';

    const radio=document.getElementById('paymentQris');
    radio.onchange=()=>{
      document.getElementById('qrisPaymentBox').hidden=false;
      btn.textContent='Konfirmasi Order';
      btn.disabled=false;
      btn.style.opacity='1';
      document.getElementById('qrisPaymentBox').scrollIntoView({behavior:'smooth',block:'nearest'});
    };

    document.getElementById('checkoutBackdrop').classList.add('show');
    document.body.classList.add('modal-open');
  }

  function confirmOrder(){
    const items=cart();
    if(!items.length){alert('Keranjang masih kosong.');return;}
    if(document.querySelector('input[name="paymentMethod"]:checked')?.value!=='QRIS'){
      alert('Pilih pembayaran QRIS terlebih dahulu.');return;
    }
    const name=document.getElementById('customerName').value.trim();
    const wa=document.getElementById('customerWa').value.trim();
    const note=document.getElementById('customerNote').value.trim();
    if(!name||!wa){alert('Isi nama dan nomor WhatsApp terlebih dahulu.');return;}
    const lines=items.map(x=>{
      const qty=Number(x.qty)||0;
      const addons=Array.isArray(x.addons)?x.addons:[];
      const detail=[
        x.name,
        `Jumlah       : ${qty}x`,
        `Harga dasar  : ${money(x.price)}`,
        ...(addons.length
          ? addons.map(a=>`Tambahan/topping: ${a.name} (+${money(a.price)})${qty>1?` per item; total tambahan ${money((Number(a.price)||0)*qty)}`:''}`)
          : ['Tambahan/topping: Tidak ada']),
        `Total produk : ${money(itemTotal(x))}`
      ];
      return detail.join('\n');
    }).join('\n\n------------------------------\n\n');
    const msg=`Halo PALUGADA SHOP30,

Saya ingin konfirmasi order setelah pembayaran QRIS.

RINCIAN PESANAN
------------------------------
\${lines}

==============================
TOTAL PEMBAYARAN: \${money(total())}
Pembayaran : QRIS
Nama       : \${name}
WA         : \${wa}\${note?'\nCatatan    : '+note:''}\`;
    window.open('https://wa.me/6282319524232?text='+encodeURIComponent(msg),'_blank');
  }

  function bind(){
    const r=document.getElementById('reviewOrderBtn');
    const b=document.getElementById('checkoutBtn');
    if(r){r.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCheckout();},true);}
    if(b){b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!b.disabled)confirmOrder();},true);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
