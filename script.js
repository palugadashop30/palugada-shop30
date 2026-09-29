const products=[
{name:"Netflix",cat:"Streaming",price:20000,detail:"1P1U • 1 Bulan • Garansi 10 hari",icon:"N"},
{name:"YouTube Premium",cat:"Streaming",price:35000,detail:"3 Bulan • Garansi 1x Ganti",icon:"YT"},
{name:"Gemini AI",cat:"AI",price:35000,detail:"3 Bulan",icon:"G"},
{name:"ChatGPT Go",cat:"AI",price:0,detail:"1 Bulan • Hubungi admin",icon:"AI"},
{name:"CapCut Pro",cat:"Design",price:35000,detail:"30 Hari • Garansi",icon:"C"},
{name:"CapCut Pro",cat:"Design",price:18000,detail:"7 Hari • Garansi",icon:"C"},
{name:"Canva",cat:"Design",price:25000,detail:"3 Bulan",icon:"CA"},
{name:"WeTV",cat:"Streaming",price:15000,detail:"1 Bulan",icon:"W"},
{name:"Vidio Platinum",cat:"Streaming",price:25000,detail:"1 Bulan • Mobile",icon:"V"},
{name:"Spotify",cat:"Music",price:20000,detail:"1 Bulan",icon:"S"},
{name:"iQIYI",cat:"Streaming",price:10000,detail:"1 Bulan",icon:"IQ"},
{name:"Vision+",cat:"Streaming",price:17000,detail:"1 Bulan",icon:"V+"},
{name:"Meitu VIP+",cat:"Design",price:19000,detail:"1 Bulan",icon:"M"},
{name:"Viu",cat:"Streaming",price:11000,detail:"1 Bulan",icon:"VIU"}
];
let cart=JSON.parse(localStorage.getItem("palugada_cart")||"[]"), activeCat="Semua";
const rp=n=>n?new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n):"Hubungi admin";
const $=id=>document.getElementById(id);

function renderCats(){
 const cats=["Semua",...new Set(products.map(p=>p.cat))];
 $("categories").innerHTML=cats.map(c=>`<button class="chip ${c===activeCat?"active":""}" onclick="setCat('${c}')">${c}</button>`).join("");
}
function renderProducts(){
 const q=$("search").value.toLowerCase();
 const list=products.filter(p=>(activeCat==="Semua"||p.cat===activeCat)&&(`${p.name} ${p.cat} ${p.detail}`.toLowerCase().includes(q)));
 $("productTotal").textContent=`${list.length} produk`;
 $("products").innerHTML=list.map((p,i)=>`<article class="card"><div class="icon">${p.icon}</div><h3>${p.name}</h3><div class="meta">${p.detail}</div><div class="price">${rp(p.price)}</div><button class="add" onclick="add(${products.indexOf(p)})">+ Keranjang</button></article>`).join("")||`<div class="empty" style="grid-column:1/-1">Produk tidak ditemukan.</div>`;
}
function setCat(c){activeCat=c;renderCats();renderProducts()}
function add(i){cart.push({...products[i],id:Date.now()+Math.random(),qty:1});save();openCart()}
function save(){localStorage.setItem("palugada_cart",JSON.stringify(cart));renderCart()}
function change(id,d){const x=cart.find(a=>a.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(a=>a.id!==id);save()}
function renderCart(){
 $("cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
 $("bottomCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
 if(!cart.length){$("cartItems").innerHTML=`<div class="empty">Keranjang masih kosong.<br>Pilih produk untuk mulai order.</div>`}
 else $("cartItems").innerHTML=cart.map(x=>`<div class="cart-row"><strong>${x.name}</strong><br><small>${x.detail}</small><div class="row-actions"><b>${rp(x.price*x.qty)}</b><div class="qty"><button onclick="change(${x.id},-1)">−</button> <span>${x.qty}</span> <button onclick="change(${x.id},1)">+</button></div></div></div>`).join("");
 $("cartTotal").textContent=rp(cart.reduce((s,x)=>s+x.price*x.qty,0));
}
function openCart(){$("drawer").classList.add("open");$("overlay").classList.add("show")}
function closeCart(){$("drawer").classList.remove("open");$("overlay").classList.remove("show")}
$("openCart").onclick=openCart;$("bottomCart").onclick=openCart;$("closeCart").onclick=closeCart;$("overlay").onclick=closeCart;$("search").oninput=renderProducts;
$("checkoutBtn").onclick=()=>{
 if(!cart.length)return alert("Keranjang masih kosong.");
 const name=$("customerName").value.trim(), wa=$("customerWa").value.trim(), note=$("customerNote").value.trim();
 if(!name||!wa)return alert("Isi nama dan nomor WhatsApp terlebih dahulu.");
 const lines=cart.map(x=>`- ${x.name} | ${x.detail} | ${x.qty}x | ${rp(x.price*x.qty)}`).join("\n");
 const total=rp(cart.reduce((s,x)=>s+x.price*x.qty,0));
 const msg=`Halo PALUGADA SHOP30, saya ingin order:\n\n${lines}\n\nTotal: ${total}\nNama: ${name}\nWA: ${wa}${note?`\nCatatan: ${note}`:""}`;
 window.open("https://wa.me/6282319524232?text="+encodeURIComponent(msg),"_blank");
};
renderCats();renderProducts();renderCart();
