const defaultProducts = [
  {id:"p1",name:"Netflix",cat:"Streaming",price:20000,detail:"1P1U • 1 Bulan • Garansi 10 hari",icon:"N",image:"",options:[]},
  {id:"p2",name:"YouTube Premium",cat:"Streaming",price:35000,detail:"3 Bulan • Garansi 1x Ganti",icon:"YT",image:"",options:[]},
  {id:"p3",name:"Gemini AI",cat:"AI",price:35000,detail:"3 Bulan",icon:"G",image:"",options:[]},
  {id:"p4",name:"ChatGPT Go",cat:"AI",price:0,detail:"1 Bulan • Hubungi admin",icon:"AI",image:"",options:[]},
  {id:"p5",name:"CapCut Pro",cat:"Design",price:35000,detail:"30 Hari • Garansi",icon:"C",image:"",options:[]},
  {id:"p6",name:"CapCut Pro",cat:"Design",price:18000,detail:"7 Hari • Garansi",icon:"C",image:""},
  {id:"p7",name:"Canva",cat:"Design",price:25000,detail:"3 Bulan",icon:"CA",image:"",options:[]},
  {id:"p8",name:"WeTV",cat:"Streaming",price:15000,detail:"1 Bulan",icon:"W",image:"",options:[]},
  {id:"p9",name:"Vidio Platinum",cat:"Streaming",price:25000,detail:"1 Bulan • Mobile",icon:"V",image:"",options:[]},
  {id:"p10",name:"Spotify",cat:"Music",price:20000,detail:"1 Bulan",icon:"S",image:"",options:[]},
  {id:"p11",name:"iQIYI",cat:"Streaming",price:10000,detail:"1 Bulan",icon:"IQ",image:"",options:[]},
  {id:"p12",name:"Vision+",cat:"Streaming",price:17000,detail:"1 Bulan",icon:"V+",image:"",options:[]},
  {id:"p13",name:"Meitu VIP+",cat:"Design",price:19000,detail:"1 Bulan",icon:"M",image:"",options:[]},
  {id:"p14",name:"Viu",cat:"Streaming",price:11000,detail:"1 Bulan",icon:"VIU",image:"",options:[]}
];

let products = [...defaultProducts];
try{
  const cached=JSON.parse(localStorage.getItem("palugada_products_cache") || "null");
  if(Array.isArray(cached) && cached.length) products=cached;
}catch(e){ console.warn("Local product cache:",e.message); }
let cart = JSON.parse(localStorage.getItem("palugada_cart") || "[]");
let activeCat = "Semua";
let editingId = null;
let pendingImage = "";

const rp = n => n ? new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n) : "Hubungi admin";
const $ = id => document.getElementById(id);

function saveProducts(){ localStorage.setItem("palugada_products_cache", JSON.stringify(products)); }

async function loadProductsFromSupabase(){
  if(typeof supabaseClient==="undefined") return;
  try{
    const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:false});
    if(error) throw error;
    if(data){
      const dbProducts=data.filter(p=>p.active === true || p.active == null).map(p=>({
        id:String(p.id),
        name:p.name||"",
        cat:p.category||p.cat||"",
        price:Number(p.price||0),
        detail:p.detail||"",
        icon:p.icon||"",
        image:p.image_url||p.image||"",
        options:Array.isArray(p.options)?p.options:[]
      }));

      if(dbProducts.length){
        // Supabase is the source of truth. Do not merge stale default/local products
        // into the live catalog; this prevents old products from reappearing.
        products=dbProducts;
        saveProducts();
        renderCats();
        renderProducts();
        renderAdmin();
      }
    }
  }catch(e){
    console.warn("Supabase products:",e.message);
    // Keep the cached catalog visible if Supabase is temporarily unavailable.
    renderCats();
    renderProducts();
    renderAdmin();
  }
}
async function getAdminSession(){
  if(typeof supabaseClient==="undefined") return null;
  try{
    let {data:{session}}=await supabaseClient.auth.getSession();
    if(session) return session;
    const {data,error}=await supabaseClient.auth.refreshSession();
    if(error) return null;
    return data?.session || null;
  }catch(e){
    console.error("Admin session:",e);
    return null;
  }
}

async function saveProductToSupabase(p){
  if(typeof supabaseClient==="undefined") return p;
  const session=await getAdminSession();
  if(!session){
    alert("Sesi admin tidak aktif. Silakan login admin lagi.");
    return false;
  }
  const row={
    name:p.name,
    category:p.cat,
    price:p.price,
    detail:p.detail,
    image_url:p.image || null,
    active:p.active!==false,
    sort_order:Number(p.sort_order||0),
    options:Array.isArray(p.options)?p.options:[]
  };
  try{
    if(p.id && !String(p.id).startsWith("p")){
      const {data,error}=await supabaseClient.from("products").update(row).eq("id",p.id).select().single();
      if(error) throw error;
      return {...p,id:data.id};
    }
    const {data,error}=await supabaseClient.from("products").insert(row).select().single();
    if(error) throw error;
    return {...p,id:data.id};
  }catch(error){
    console.error("Supabase save product:", error);
    const detail=error?.message || error?.details || "Akses ditolak.";
    alert("Gagal menyimpan produk ke Supabase.\n\n"+detail+"\n\nPastikan login admin masih aktif.");
    return false;
  }
}

async function removeProductFromSupabase(id){
  if(typeof supabaseClient==="undefined") return true;
  if(String(id).startsWith("p")) return true;
  const session=await getAdminSession();
  if(!session){
    alert("Sesi admin tidak aktif. Silakan login admin lagi.");
    return false;
  }
  const {error}=await supabaseClient.from("products").delete().eq("id",Number(id));
  if(error){
    console.error("Supabase delete product:", error);
    alert("Gagal menghapus produk dari Supabase.\n\n"+(error.message||"Akses ditolak.")+"\n\nPastikan login admin masih aktif.");
    return false;
  }
  return true;
}

function renderCats(){
  const cats = ["Semua", ...new Set(products.map(p=>p.cat).filter(Boolean))];
  $("categories").innerHTML = cats.map(c =>
    `<button type="button" class="chip ${c===activeCat?"active":""}" onclick="window.setCat('${String(c).replace(/'/g,"\\'")}')">${escapeHtml(c)}</button>`
  ).join("");
}

function productVisual(p, cls=""){
  return p.image
    ? `<img class="${cls}" src="${p.image}" alt="${escapeHtml(p.name)}">`
    : `<div class="icon ${cls}">${escapeHtml(p.icon || p.name.slice(0,2).toUpperCase())}</div>`;
}

function renderProducts(){
  const q = $("search").value.toLowerCase();
  const list = products.filter(p =>
    (activeCat==="Semua" || p.cat===activeCat) &&
    `${p.name} ${p.cat} ${p.detail}`.toLowerCase().includes(q)
  );
  $("productTotal").textContent = `${list.length} produk`;
  $("products").innerHTML = list.map(p => `
    <article class="card">
      ${productVisual(p)}
      <h3>${escapeHtml(p.name)}</h3>
      <div class="meta">${escapeHtml(p.detail || "")}</div>
      <div class="price">${rp(p.price)}</div>
      <button class="add" type="button" onclick="window.addProductToCart(this.dataset.id)" data-id="${String(p.id)}">${(p.options||[]).length?"+ Pilih & Keranjang":"+ Keranjang"}</button>
    </article>
  `).join("") || `<div class="empty" style="grid-column:1/-1">Produk tidak ditemukan.</div>`;
}

function renderAdmin(){
  const q=$("adminSearch").value.toLowerCase();
  const list=products.filter(p=>`${p.name} ${p.cat} ${p.detail}`.toLowerCase().includes(q));
  $("adminProducts").innerHTML=list.map(p=>`
    <article class="admin-card">
      ${productVisual(p,"admin-image")}
      <div class="admin-info">
        <strong>${escapeHtml(p.name)}</strong>
        <span>${escapeHtml(p.cat)} • ${rp(p.price)}</span>
        <small>${escapeHtml(p.detail||"Tanpa detail")}</small>
      </div>
      <div class="admin-actions">
        <button type="button" onclick='window.editProduct("${String(p.id).replace(/"/g,"&quot;")}")'>✏ Edit</button>
        <button type="button" class="danger" onclick='window.deleteProduct("${String(p.id).replace(/"/g,"&quot;")}")'>🗑 Hapus</button>
      </div>
    </article>
  `).join("")||`<div class="empty">Produk tidak ditemukan.</div>`;
}
window.editProduct=editProduct;
window.deleteProduct=deleteProduct;

function setCat(c){ activeCat=c; renderCats(); renderProducts(); }
window.setCat=setCat;

function add(id){ window.addProductToCart(id); }

function saveCart(){
  localStorage.setItem("palugada_cart",JSON.stringify(cart));
  renderCart();
}

function change(id,d){
  const x=cart.find(a=>a.id===id);
  if(!x)return;
  x.qty+=d;
  if(x.qty<=0)cart=cart.filter(a=>a.id!==id);
  saveCart();
}

function cartItemTotal(x){ return (Number(x.price)||0)+(x.addons||[]).reduce((s,a)=>s+Number(a.price||0),0); }
function renderCart(){
  const count=cart.reduce((s,x)=>s+x.qty,0);
  $("cartCount").textContent=count; $("bottomCount").textContent=count;
  if(!cart.length){ $("cartItems").innerHTML='<div class="empty">Keranjang masih kosong.<br>Pilih produk untuk mulai order.</div>'; }
  else $("cartItems").innerHTML=cart.map(x=>'<div class="cart-row"><strong>'+escapeHtml(x.name)+'</strong><br><small>'+escapeHtml(x.detail||"")+'</small>'+((x.addons||[]).length?'<div class="cart-addons">+ '+x.addons.map(a=>escapeHtml(a.name)+' ('+rp(a.price)+')').join(", ")+'</div>':'')+'<div class="row-actions"><b>'+rp(cartItemTotal(x)*x.qty)+'</b><div class="qty"><button onclick="change('+x.id+',-1)">−</button> <span>'+x.qty+'</span> <button onclick="change('+x.id+',1)">+</button></div></div>'+((x.addons||[]).length?'<button class="edit-cart" onclick="editCartItem('+x.id+')">✏ Edit pilihan</button>':'')+'</div>').join("");
  $("cartTotal").textContent=rp(cart.reduce((s,x)=>s+cartItemTotal(x)*x.qty,0));
}
window.editCartItem=function(cartId){
  const x=cart.find(a=>a.id===cartId); if(!x)return;
  const p=products.find(a=>String(a.id)===String(x.productId||""))||products.find(a=>a.name===x.name&&a.detail===x.detail);
  if(!p||!(p.options||[]).length)return alert("Produk ini tidak memiliki pilihan tambahan.");
  $("optionTitle").textContent="Edit "+p.name;
  const selected=new Set((x.addons||[]).map(a=>a.name));
  $("optionList").innerHTML='<div class="option-base"><strong>Harga dasar: '+rp(p.price)+'</strong></div>'+p.options.map((o,i)=>'<label class="option-check"><input type="checkbox" data-option-index="'+i+'" '+(selected.has(o.name)?"checked":"")+'><span>'+escapeHtml(o.name)+'</span><b>+'+rp(o.price)+'</b></label>').join("");
  $("optionBackdrop").dataset.productId=p.id; $("optionBackdrop").dataset.editCartId=cartId;
  $("optionBackdrop").classList.add("show"); document.body.classList.add("modal-open");
}
function openCart(){ $("drawer").classList.add("open"); $("overlay").classList.add("show"); }
function closeCart(){ $("drawer").classList.remove("open"); $("overlay").classList.remove("show"); }

async function openAdmin(){
  const session=await getAdminSession();
  if(!session){
    $("loginError").textContent="";
    $("loginBackdrop").classList.add("show");
    document.body.classList.add("modal-open");
    return;
  }
  renderAdmin();
  $("adminBackdrop").classList.add("show");
  document.body.classList.add("modal-open");
}
function closeLogin(){
  $("loginBackdrop").classList.remove("show");
  if(!$("adminBackdrop").classList.contains("show")&&!$("formBackdrop").classList.contains("show"))document.body.classList.remove("modal-open");
}
function closeAdmin(){
  $("adminBackdrop").classList.remove("show");
  if(!$("formBackdrop").classList.contains("show")) document.body.classList.remove("modal-open");
}

function resetForm(){
  editingId=null; pendingImage="";
  $("productId").value="";
  $("formTitle").textContent="Tambah Produk";
  $("nameInput").value="";
  $("catInput").value="";
  $("priceInput").value="";
  $("detailInput").value="";
  $("iconInput").value="";
  $("imageInput").value="";
  $("imagePreview").innerHTML="Gambar";
  $("removeImageBtn").disabled=true;
  renderOptionEditor([]);
}

function openForm(id=null){
  resetForm();
  if(id){
    const p=products.find(x=>String(x.id)===String(id));
    if(!p)return;
    editingId=id;
    $("formTitle").textContent="Edit Produk";
    $("nameInput").value=p.name;
    $("catInput").value=p.cat;
    $("priceInput").value=p.price;
    $("detailInput").value=p.detail||"";
    $("iconInput").value=p.icon||"";
    pendingImage=p.image||"";
    showImagePreview(p.image||"");
    renderOptionEditor(Array.isArray(p.options)?p.options:[]);
  }
  $("formBackdrop").classList.add("show");
  document.body.classList.add("modal-open");
}

function closeForm(){
  $("formBackdrop").classList.remove("show");
  if(!$("adminBackdrop").classList.contains("show")) document.body.classList.remove("modal-open");
}

function editProduct(id){ openForm(id); }

async function deleteProduct(id){
  const p=products.find(x=>String(x.id)===String(id));
  if(!p)return;
  if(!confirm(`Hapus produk "${p.name}"?`))return;
  if(!(await removeProductFromSupabase(id))) return;
  products=products.filter(x=>String(x.id)!==String(id));
  saveProducts();
  renderCats(); renderProducts(); renderAdmin();
}

function showImagePreview(src){
  $("imagePreview").innerHTML = src
    ? `<img src="${src}" alt="Preview gambar">`
    : "Gambar";
  $("removeImageBtn").disabled=!src;
}

function renderOptionEditor(options){
  const box=$("optionEditor");
  if(!box)return;
  box.innerHTML=(options||[]).map((o,i)=>
    `<div class="option-edit-row"><input class="option-name" placeholder="Nama tambahan" value="${escapeHtml(o.name||"")}"><input class="option-price" type="number" min="0" step="1000" placeholder="Harga" value="${Number(o.price||0)}"><button type="button" onclick="removeOptionRow(this)">✕</button></div>`).join("");
}
function readOptionEditor(){
  return Array.from(document.querySelectorAll(".option-edit-row")).map(r=>({name:r.querySelector(".option-name").value.trim(),price:Number(r.querySelector(".option-price").value)||0})).filter(o=>o.name);
}
window.removeOptionRow=function(btn){btn.closest(".option-edit-row")?.remove();};
window.addOptionRow=function(){
  const box=$("optionEditor");
  box.insertAdjacentHTML("beforeend",`<div class="option-edit-row"><input class="option-name" placeholder="Nama tambahan"><input class="option-price" type="number" min="0" step="1000" placeholder="Harga"><button type="button" onclick="removeOptionRow(this)">✕</button></div>`);
};

function openOptionPicker(id){
  const p=products.find(x=>String(x.id)===String(id));
  if(!p)return;
  const opts=Array.isArray(p.options)?p.options:[];
  if(!opts.length){ cart.push({...p,productId:p.id,id:Date.now()+Math.random(),qty:1,addons:[]}); saveCart(); openCart(); return; }
  $("optionTitle").textContent=p.name;
  $("optionList").innerHTML=`<div class="option-base"><strong>Harga dasar: ${rp(p.price)}</strong></div>`+
    opts.map((o,i)=>`<label class="option-check"><input type="checkbox" data-option-index="${i}"><span>${escapeHtml(o.name)}</span><b>+${rp(o.price)}</b></label>`).join("");
  $("optionBackdrop").dataset.productId=p.id;
  $("optionBackdrop").classList.add("show");
  document.body.classList.add("modal-open");
}
function closeOptionPicker(){ delete $("optionBackdrop").dataset.editCartId; $("optionBackdrop").classList.remove("show"); if(!$("adminBackdrop").classList.contains("show")&&!$("formBackdrop").classList.contains("show")&&!$("loginBackdrop").classList.contains("show"))document.body.classList.remove("modal-open"); }
function confirmOptionPicker(){
  const id=$("optionBackdrop").dataset.productId;
  const p=products.find(x=>String(x.id)===String(id));
  if(!p)return;
  const opts=Array.isArray(p.options)?p.options:[];
  const addons=Array.from(document.querySelectorAll("#optionList input[data-option-index]:checked")).map(i=>opts[Number(i.dataset.optionIndex)]).filter(Boolean).map(o=>({name:o.name,price:Number(o.price)||0}));
  const editId=Number($("optionBackdrop").dataset.editCartId||0); const item=cart.find(a=>a.id===editId);
  if(item){ item.addons=addons; item.productId=p.id; } else cart.push({...p,productId:p.id,id:Date.now()+Math.random(),qty:1,addons});
  delete $("optionBackdrop").dataset.editCartId; closeOptionPicker(); saveCart(); openCart();
}

function readImage(file){
  if(!file)return;
  if(file.size > 3*1024*1024){
    alert("Ukuran gambar maksimal 3 MB.");
    $("imageInput").value="";
    return;
  }
  const reader=new FileReader();
  reader.onload=e=>{
    pendingImage=e.target.result;
    showImagePreview(pendingImage);
  };
  reader.readAsDataURL(file);
}

$("productForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const data={
    name:$("nameInput").value.trim(),
    cat:$("catInput").value.trim(),
    price:Number($("priceInput").value)||0,
    detail:$("detailInput").value.trim(),
    icon:$("iconInput").value.trim() || $("nameInput").value.trim().slice(0,2).toUpperCase(),
    image:pendingImage,
    options:readOptionEditor()
  };
  if(!data.name || !data.cat) return alert("Nama dan kategori wajib diisi.");

  const existing=editingId ? products.find(p=>p.id===editingId) : null;
  const product=editingId ? {...existing,...data,id:editingId} : {...data};
  const savedProduct=await saveProductToSupabase(product);
  if(!savedProduct) return;
  if(editingId){
    const i=products.findIndex(p=>p.id===editingId);
    if(i>=0) products[i]=savedProduct;
  }else{
    products.unshift(savedProduct);
  }
  saveProducts();
  renderCats(); renderProducts(); renderAdmin();
  closeForm();
});

$("imageInput").addEventListener("change", e=>readImage(e.target.files[0]));
$("removeImageBtn").onclick=()=>{
  pendingImage="";
  $("imageInput").value="";
  showImagePreview("");
};
$("addProductBtn").onclick=()=>openForm();
$("closeForm").onclick=closeForm;
$("cancelForm").onclick=closeForm;
$("closeAdmin").onclick=closeAdmin;
$("openAdmin").addEventListener("click",function(e){e.preventDefault();openAdmin();});
$("closeLogin").onclick=closeLogin;
$("cancelLogin").onclick=closeLogin;
$("loginBackdrop").addEventListener("click",e=>{if(e.target===$("loginBackdrop"))closeLogin()});
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  $("loginError").textContent="";
  const {error}=await supabaseClient.auth.signInWithPassword({
    email:$("loginEmail").value.trim(),
    password:$("loginPassword").value
  });
  if(error){$("loginError").textContent=error.message || "Email atau password salah.";return;}
  const sessionCheck=await getAdminSession();
  if(!sessionCheck){$("loginError").textContent="Login berhasil tetapi sesi admin belum aktif. Coba login lagi.";return;}
  closeLogin();
  openAdmin();
});
$("logoutBtn").onclick=async()=>{await supabaseClient.auth.signOut();closeAdmin();};
$("adminSearch").oninput=renderAdmin;

$("openCart").onclick=openCart;
$("bottomCart").onclick=openCart;
$("closeCart").onclick=closeCart;
$("overlay").onclick=closeCart;
$("search").oninput=renderProducts;
window.addProductToCart=function(id){ openOptionPicker(id); };

$("adminBackdrop").addEventListener("click",e=>{if(e.target===$("adminBackdrop"))closeAdmin()});
$("formBackdrop").addEventListener("click",e=>{if(e.target===$("formBackdrop"))closeForm()});
$("closeOption").onclick=closeOptionPicker;
$("cancelOption").onclick=closeOptionPicker;
$("confirmOption").onclick=confirmOptionPicker;
$("optionBackdrop").addEventListener("click",e=>{if(e.target===$("optionBackdrop"))closeOptionPicker()});
$("addOptionBtn").onclick=window.addOptionRow;

$("checkoutBtn").onclick=()=>{
  if(!cart.length)return alert("Keranjang masih kosong.");
  const name=$("customerName").value.trim(), wa=$("customerWa").value.trim(), note=$("customerNote").value.trim();
  if(!name||!wa)return alert("Isi nama dan nomor WhatsApp terlebih dahulu.");
  const lines=cart.map(x=>`- ${x.name} | ${x.detail}${(x.addons||[]).length?` | Tambahan: ${x.addons.map(a=>a.name+` +${rp(a.price)}`).join(", ")}`:""} | ${x.qty}x | ${rp((x.price+(x.addons||[]).reduce((s,a)=>s+Number(a.price||0),0))*x.qty)}`).join("\n");
  const total=rp(cart.reduce((s,x)=>s+x.price*x.qty,0));
  const msg=`Halo PALUGADA SHOP30, saya ingin order:\n\n${lines}\n\nTotal: ${total}\nNama: ${name}\nWA: ${wa}${note?`\nCatatan: ${note}`:""}`;
  window.open("https://wa.me/6282319524232?text="+encodeURIComponent(msg),"_blank");
};


renderCats();
renderProducts();
renderCart();
loadProductsFromSupabase();function openCheckout(){
  if(!cart.length)return alert("Keranjang masih kosong.");
  $("checkoutSummary").innerHTML='<div class="summary-box">'+cart.map(x=>'<div>• '+escapeHtml(x.name)+' '+((x.addons||[]).length?'(+ '+x.addons.map(a=>escapeHtml(a.name)).join(", ")+') ':'')+'— '+x.qty+'x — '+rp(cartItemTotal(x)*x.qty)+'</div>').join("")+'<hr><strong>Total: '+rp(cart.reduce((s,x)=>s+cartItemTotal(x)*x.qty,0))+'</strong></div>';
  $("checkoutBackdrop").classList.add("show"); document.body.classList.add("modal-open");
}
function closeCheckout(){ $("checkoutBackdrop").classList.remove("show"); document.body.classList.remove("modal-open"); }
$("reviewOrderBtn").onclick=openCheckout; $("closeCheckout").onclick=closeCheckout; $("backToCart").onclick=closeCheckout;
$("checkoutBackdrop").addEventListener("click",e=>{if(e.target===$("checkoutBackdrop"))closeCheckout()});
$("checkoutBtn").onclick=()=>{
  if(!cart.length)return alert("Keranjang masih kosong.");
  const name=$("customerName").value.trim(), wa=$("customerWa").value.trim(), note=$("customerNote").value.trim();
  if(!name||!wa)return alert("Isi nama dan nomor WhatsApp terlebih dahulu.");
  const lines=cart.map(x=>'- '+x.name+' | '+x.detail+((x.addons||[]).length?' | Tambahan: '+x.addons.map(a=>a.name+' +'+rp(a.price)).join(", "):"")+' | '+x.qty+'x | '+rp(cartItemTotal(x)*x.qty)).join("\n");
  const total=rp(cart.reduce((s,x)=>s+cartItemTotal(x)*x.qty,0));
  const msg='Halo PALUGADA SHOP30, saya ingin order:\n\n'+lines+'\n\nTotal: '+total+'\nNama: '+name+'\nWA: '+wa+(note?'\nCatatan: '+note:"");
  window.open("https://wa.me/6282319524232?text="+encodeURIComponent(msg),"_blank");
};

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

renderCats();
renderProducts();
renderCart();
loadProductsFromSupabase();
