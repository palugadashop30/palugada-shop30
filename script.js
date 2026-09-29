const defaultProducts = [
  {id:"p1",name:"Netflix",cat:"Streaming",price:20000,detail:"1P1U • 1 Bulan • Garansi 10 hari",icon:"N",image:""},
  {id:"p2",name:"YouTube Premium",cat:"Streaming",price:35000,detail:"3 Bulan • Garansi 1x Ganti",icon:"YT",image:""},
  {id:"p3",name:"Gemini AI",cat:"AI",price:35000,detail:"3 Bulan",icon:"G",image:""},
  {id:"p4",name:"ChatGPT Go",cat:"AI",price:0,detail:"1 Bulan • Hubungi admin",icon:"AI",image:""},
  {id:"p5",name:"CapCut Pro",cat:"Design",price:35000,detail:"30 Hari • Garansi",icon:"C",image:""},
  {id:"p6",name:"CapCut Pro",cat:"Design",price:18000,detail:"7 Hari • Garansi",icon:"C",image:""},
  {id:"p7",name:"Canva",cat:"Design",price:25000,detail:"3 Bulan",icon:"CA",image:""},
  {id:"p8",name:"WeTV",cat:"Streaming",price:15000,detail:"1 Bulan",icon:"W",image:""},
  {id:"p9",name:"Vidio Platinum",cat:"Streaming",price:25000,detail:"1 Bulan • Mobile",icon:"V",image:""},
  {id:"p10",name:"Spotify",cat:"Music",price:20000,detail:"1 Bulan",icon:"S",image:""},
  {id:"p11",name:"iQIYI",cat:"Streaming",price:10000,detail:"1 Bulan",icon:"IQ",image:""},
  {id:"p12",name:"Vision+",cat:"Streaming",price:17000,detail:"1 Bulan",icon:"V+",image:""},
  {id:"p13",name:"Meitu VIP+",cat:"Design",price:19000,detail:"1 Bulan",icon:"M",image:""},
  {id:"p14",name:"Viu",cat:"Streaming",price:11000,detail:"1 Bulan",icon:"VIU",image:""}
];

let products = JSON.parse(localStorage.getItem("palugada_products") || "null") || defaultProducts;
let cart = JSON.parse(localStorage.getItem("palugada_cart") || "[]");
let activeCat = "Semua";
let editingId = null;
let pendingImage = "";

const rp = n => n ? new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n) : "Hubungi admin";
const $ = id => document.getElementById(id);

function saveProducts(){ localStorage.setItem("palugada_products", JSON.stringify(products)); }

async function loadProductsFromSupabase(){
  if(typeof supabaseClient==="undefined") return;
  try{
    const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:false});
    if(error) throw error;
    if(data){
      products=data.filter(p=>p.active === true || p.active == null).map(p=>({id:p.id,name:p.name||"",cat:p.category||p.cat||"",price:Number(p.price||0),detail:p.detail||"",icon:p.icon||"",image:p.image_url||p.image||""}));
      saveProducts(); renderCats(); renderProducts(); renderAdmin();
    }
  }catch(e){ console.warn("Supabase products:",e.message); }
}

async function saveProductToSupabase(p){
  if(typeof supabaseClient==="undefined") return p;
  const row={
    name:p.name,
    category:p.cat,
    price:p.price,
    detail:p.detail,
    image_url:p.image || null,
    active:p.active!==false,
    sort_order:Number(p.sort_order||0)
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
    console.error(error);
    alert("Supabase menolak penyimpanan: "+error.message);
    return false;
  }
}

async function removeProductFromSupabase(id){
  if(typeof supabaseClient==="undefined") return true;
  const {error}=await supabaseClient.from("products").delete().eq("id",id);
  if(error){ console.error(error); alert("Supabase menolak penghapusan: "+error.message); return false; }
  return true;
}

function renderCats(){
  const cats = ["Semua", ...new Set(products.map(p=>p.cat).filter(Boolean))];
  $("categories").innerHTML = cats.map(c =>
    `<button class="chip ${c===activeCat?"active":""}" onclick="setCat(${JSON.stringify(c)})">${escapeHtml(c)}</button>`
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
      <button class="add" type="button" data-product-id="${escapeHtml(p.id)}">+ Keranjang</button>
    </article>
  `).join("") || `<div class="empty" style="grid-column:1/-1">Produk tidak ditemukan.</div>`;
}

function renderAdmin(){
  const q = $("adminSearch").value.toLowerCase();
  const list = products.filter(p => `${p.name} ${p.cat} ${p.detail}`.toLowerCase().includes(q));
  $("adminProducts").innerHTML = list.map(p => `
    <article class="admin-card">
      ${productVisual(p,"admin-image")}
      <div class="admin-info">
        <strong>${escapeHtml(p.name)}</strong>
        <span>${escapeHtml(p.cat)} • ${rp(p.price)}</span>
        <small>${escapeHtml(p.detail || "Tanpa detail")}</small>
      </div>
      <div class="admin-actions">
        <button onclick="editProduct('${p.id}')">✏ Edit</button>
        <button class="danger" onclick="deleteProduct('${p.id}')">🗑 Hapus</button>
      </div>
    </article>
  `).join("") || `<div class="empty">Produk tidak ditemukan.</div>`;
}

function setCat(c){ activeCat=c; renderCats(); renderProducts(); }

function add(id){
  const p = products.find(x=>String(x.id)===String(id));
  if(!p) return;
  cart.push({...p,id:Date.now()+Math.random(),qty:1});
  saveCart();
  openCart();
}

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

function renderCart(){
  const count=cart.reduce((s,x)=>s+x.qty,0);
  $("cartCount").textContent=count;
  $("bottomCount").textContent=count;
  if(!cart.length){
    $("cartItems").innerHTML=`<div class="empty">Keranjang masih kosong.<br>Pilih produk untuk mulai order.</div>`;
  } else {
    $("cartItems").innerHTML=cart.map(x=>`
      <div class="cart-row">
        <strong>${escapeHtml(x.name)}</strong><br><small>${escapeHtml(x.detail||"")}</small>
        <div class="row-actions"><b>${rp(x.price*x.qty)}</b>
          <div class="qty"><button onclick="change(${x.id},-1)">−</button> <span>${x.qty}</span> <button onclick="change(${x.id},1)">+</button></div>
        </div>
      </div>`).join("");
  }
  $("cartTotal").textContent=rp(cart.reduce((s,x)=>s+x.price*x.qty,0));
}

function openCart(){ $("drawer").classList.add("open"); $("overlay").classList.add("show"); }
function closeCart(){ $("drawer").classList.remove("open"); $("overlay").classList.remove("show"); }

async function openAdmin(){
  const {data:{session}}=await supabaseClient.auth.getSession();
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
    image:pendingImage
  };
  if(!data.name || !data.cat) return alert("Nama dan kategori wajib diisi.");

  const existing=editingId ? products.find(p=>p.id===editingId) : null;
  const product=editingId ? {...existing,...data,id:editingId} : {...data,id:"p"+Date.now()};
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
$("openAdmin").onclick=openAdmin;
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
  if(error){$("loginError").textContent="Email atau password salah.";return;}
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
$("products").addEventListener("click",e=>{ const btn=e.target.closest(".add"); if(btn) add(btn.dataset.productId); });

$("adminBackdrop").addEventListener("click",e=>{if(e.target===$("adminBackdrop"))closeAdmin()});
$("formBackdrop").addEventListener("click",e=>{if(e.target===$("formBackdrop"))closeForm()});

$("checkoutBtn").onclick=()=>{
  if(!cart.length)return alert("Keranjang masih kosong.");
  const name=$("customerName").value.trim(), wa=$("customerWa").value.trim(), note=$("customerNote").value.trim();
  if(!name||!wa)return alert("Isi nama dan nomor WhatsApp terlebih dahulu.");
  const lines=cart.map(x=>`- ${x.name} | ${x.detail} | ${x.qty}x | ${rp(x.price*x.qty)}`).join("\n");
  const total=rp(cart.reduce((s,x)=>s+x.price*x.qty,0));
  const msg=`Halo PALUGADA SHOP30, saya ingin order:\n\n${lines}\n\nTotal: ${total}\nNama: ${name}\nWA: ${wa}${note?`\nCatatan: ${note}`:""}`;
  window.open("https://wa.me/6282319524232?text="+encodeURIComponent(msg),"_blank");
};

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

renderCats();
renderProducts();
renderCart();
loadProductsFromSupabase();
