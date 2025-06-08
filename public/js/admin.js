const audioPlayer = document.getElementById("audio-player");

window.addEventListener("click", function () {
  audioPlayer.play();
});

// LOGIN ADMIN

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}

function checkLogin() {
  if (getCookie("adminLogin") === "true") {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    fetchProduk();
  } else {
    document.getElementById("loginForm").style.display = "flex";
  }
}

function handleLogin(e) {
  e.preventDefault();

  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  fetch(`/api/login?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 401) {
        throw new Error("Unauthorized");
      } else {
        throw new Error("Request failed");
      }
    })
    .then((data) => {
      if (data.success) {
        setCookie("adminLogin", "true", 1);
        checkLogin();
      } else {
        alert(data.message || "Username atau password salah!");
      }
    })
    .catch((err) => {
      if (err.message === "Unauthorized") {
        alert("Username atau password salah!");
      } else {
        console.error(err);
        alert("Terjadi kesalahan saat melakukan request. Silakan coba lagi.");
      }
    });
}

function logout() {
  setCookie("adminLogin", "false", -1);
  location.reload();
}

// PRODUK
let produk = [];

async function fetchProduk() {
  const res = await fetch("/api/products.js");
  produk = await res.json();
  renderProduk();
}

function renderProduk() {
  const container = document.getElementById("productList");
  container.innerHTML = "";
  container.className = "product-grid";

  produk.forEach((item, index) => {
    let paketText = "";
    if (Array.isArray(item.paket) && item.paket.length > 0) {
      paketText = item.paket
        .map((p) => {
          const hargaNum = typeof p.harga === "number" ? p.harga : parseInt(p.harga) || 0;
          return `${p.name} - Rp ${hargaNum.toLocaleString("id-ID")}`;
        })
        .join("<br>");
    }

    const hargaNum = item.harga !== undefined && item.harga !== "" ? (typeof item.harga === "number" ? item.harga : parseInt(item.harga)) : null;
    const hargaText = hargaNum !== null ? `Rp ${hargaNum.toLocaleString("id-ID")}` : "-";

    const el = document.createElement("div");
    el.className = "product-card";
    el.innerHTML = `
      <img src="${item.img}" alt="${item.nama}">
      <h3>${item.nama}</h3>
      ${item.desc ? `<p class="desc">${item.desc}</p>` : ""}
      ${hargaNum !== null && (!item.paket || item.paket.length === 0) ? `<p class="price">${hargaText}</p>` : ""}
      ${paketText ? `<p class="paket">${paketText}</p>` : ""}
      <div class="card-actions">
        <button onclick="editProduk(${index})">Edit</button>
        <button onclick="hapusProduk(${index})" style="background:#cc3344">Hapus</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function openForm(isEdit = false) {
  const form = document.getElementById("productForm");
  form.classList.add("active");
  document.body.classList.add("form-active");

  if (!isEdit) {
    document.getElementById("formTitle").textContent = "Tambah Produk";
    document.getElementById("editIndex").value = "";
    document.getElementById("nama").value = "";
    document.getElementById("img").value = "";
    document.getElementById("harga").value = "";
    document.getElementById("paket").value = "";
    document.getElementById("deskripsi").value = "";
  }
}

function closeForm() {
  const form = document.getElementById("productForm");
  form.classList.remove("active");
  document.body.classList.remove("form-active");
}

function editProduk(index) {
  const p = produk[index];
  openForm(true);
  document.getElementById("formTitle").textContent = "Edit Produk";
  document.getElementById("editIndex").value = index;
  document.getElementById("nama").value = p.nama || "";
  document.getElementById("img").value = p.img || "";
  document.getElementById("harga").value = p.harga !== undefined && p.harga !== "" ? p.harga : "";
  document.getElementById("deskripsi").value = p.desc || "";

  if (Array.isArray(p.paket) && p.paket.length > 0) {
    document.getElementById("paket").value = p.paket.map((x) => `${x.name} - ${x.harga}`).join("\n");
  } else {
    document.getElementById("paket").value = "";
  }
}

async function hapusProduk(index) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;
  const res = await fetch("/api/products.js", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  });
  const data = await res.json();
  if (data.success) {
    alert("Produk dihapus!");
    fetchProduk();
  } else {
    alert("Gagal menghapus produk");
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: user,
        password: pass,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setCookie("adminLogin", "true", 1);
      checkLogin();
    } else {
      alert(data.message || "Username atau password salah!");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Terjadi kesalahan saat melakukan request. Silakan coba lagi.");
  }

  const paketRaw = document.getElementById("paket").value.trim();
  const paketArr = paketRaw
    ? paketRaw
        .split("\n")
        .map((p) => {
          const parts = p.split("-");
          if (parts.length < 2) return null;
          const name = parts[0].trim();
          const hargaStr = parts.slice(1).join("-").replace(/\D/g, "");
          const harga = parseInt(hargaStr);
          if (!name || isNaN(harga)) return null;
          return { name, harga };
        })
        .filter((p) => p !== null)
    : [];

  const hargaInput = document.getElementById("harga").value.trim();
  const harga = hargaInput === "" ? "" : parseInt(hargaInput.replace(/\D/g, ""));

  const payload = {
    nama: document.getElementById("nama").value.trim(),
    img: document.getElementById("img").value.trim(),
    harga: harga,
    paket: paketArr,
    desc: document.getElementById("deskripsi").value.trim() || "",
  };

  const method = index === "" ? "POST" : "PUT";
  const body = index === "" ? payload : { index: parseInt(index), produkEdit: payload };

  const res = await fetch("/api/products.js", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.success || res.ok) {
    alert(index === "" ? "Produk ditambahkan!" : "Produk diperbarui!");
    closeForm();
    fetchProduk();
  } else {
    alert("Terjadi kesalahan saat menyimpan");
  }
}

// mulai cek login dan load produk
checkLogin();
