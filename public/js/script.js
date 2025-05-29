let produkList = [];

const produkContainer = document.getElementById("produkContainer");
const checkoutSection = document.getElementById("checkoutSection");
const produkDipilihInput = document.getElementById("produkDipilih");
const hargaProdukInput = document.getElementById("hargaProduk");
const paketPilihanSelect = document.getElementById("paketPilihan");
const labelPaket = document.getElementById("labelPaket");
const namaPembeliInput = document.getElementById("namaPembeli");
const closeFormBtn = document.getElementById("closeFormBtn");
const checkoutForm = document.getElementById("checkoutForm");
const produkDeskripsi = document.getElementById("produkDeskripsi");

// Render produk dari API
async function renderProduk() {
  try {
    produkContainer.innerHTML = "<p>Memuat produk...</p>";
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Gagal memuat produk");
    produkList = await res.json();

    produkContainer.innerHTML = "";
    produkList.forEach((produk, index) => {
      const card = document.createElement("div");
      card.className = "card";

      // Bikin wrapper untuk gambar
      const imgWrapper = document.createElement("div");
      imgWrapper.className = "img-wrapper";

      const img = document.createElement("img");
      img.src = produk.img;
      img.alt = produk.nama;

      // Masukkan img ke wrapper
      imgWrapper.appendChild(img);

      // Masukkan wrapper dan elemen lain ke card
      card.appendChild(imgWrapper);

      const h3 = document.createElement("h3");
      h3.textContent = produk.nama;
      card.appendChild(h3);

      const btn = document.createElement("button");
      btn.textContent = "CHECKOUT";
      btn.onclick = () => bukaFormCheckout(index);
      card.appendChild(btn);

      produkContainer.appendChild(card);
    });
  } catch (e) {
    produkContainer.innerHTML = "<p>Gagal memuat produk.</p>";
    console.error(e);
  }
}

renderProduk();

// Buka form checkout produk
function bukaFormCheckout(index) {
  const produk = produkList[index];
  checkoutSection.classList.remove("hidden");
  document.body.classList.add("form-active");

  produkDipilihInput.value = produk.nama;
  namaPembeliInput.value = "";
  produkDeskripsi.textContent = produk.desc || "Tidak Ada Deskripsi";
  if (produk.paket && produk.paket.length > 0) {
    labelPaket.classList.remove("hidden");
    paketPilihanSelect.classList.remove("hidden");
    paketPilihanSelect.innerHTML = "";
    produk.paket.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.harga;
      option.textContent = `${p.name} - Rp${p.harga.toLocaleString()}`;
      paketPilihanSelect.appendChild(option);
    });
    hargaProdukInput.value = "Rp" + produk.paket[0].harga.toLocaleString();
  } else if (produk.harga) {
    labelPaket.classList.add("hidden");
    paketPilihanSelect.classList.add("hidden");
    hargaProdukInput.value = "Rp" + produk.harga.toLocaleString();
  } else {
    labelPaket.classList.add("hidden");
    paketPilihanSelect.classList.add("hidden");
    hargaProdukInput.value = "Rp0";
  }
}

// Update harga saat paket dipilih berubah
paketPilihanSelect.addEventListener("change", () => {
  hargaProdukInput.value = "Rp" + Number(paketPilihanSelect.value).toLocaleString();
});

// Tutup form checkout
closeFormBtn.addEventListener("click", () => {
  checkoutSection.classList.add("hidden");
  document.body.classList.remove("form-active");
});

// Kirim order ke WhatsApp
function sendToWhatsApp(event) {
  event.preventDefault();

  const nama = namaPembeliInput.value.trim();
  const produk = produkDipilihInput.value;
  const harga = hargaProdukInput.value;
  const paket = !paketPilihanSelect.classList.contains("hidden") ? paketPilihanSelect.options[paketPilihanSelect.selectedIndex].text : "";

  if (!nama) {
    alert("Isi nama pembeli!");
    return;
  }

  let pesan = `Halo Admin, saya ingin order:\n\nNama: ${nama}\nProduk: ${produk}`;
  if (paket) pesan += `\nPaket/Spesifikasi: ${paket}`;
  pesan += `\nHarga: ${harga}`;

  const waUrl = `https://wa.me/6287866361260?text=${encodeURIComponent(pesan)}`;
  window.open(waUrl, "_blank");
}

// Submit form checkout
checkoutForm.addEventListener("submit", sendToWhatsApp);

const audioPlayer = document.getElementById("audio-player");

window.addEventListener("click", function () {
  audioPlayer.play();
});
