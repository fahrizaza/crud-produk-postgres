'use client';

import { useEffect, useState } from 'react';

const emptyForm = { name: '', description: '', price: '', category_id: '' };

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data');
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id ? String(product.category_id) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        category_id: form.category_id || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    setError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah kategori');
      setNewCategory('');
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingCategory(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header anim-left delay-1">
        <div>
          <h1>CRUD Produk</h1>
          <p className="subtitle">Next.js + PostgreSQL — kelola produk & kategori</p>
        </div>
        <div className="header-stat">
          <span className="stat-number">{products.length}</span>
          <span className="stat-label">Produk</span>
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}

      <div className="layout">
        {/* Kolom kiri: form */}
        <aside className="layout-side anim-left delay-2">
          <div className="card">
            <h3>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="name">Nama Produk</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Misal: Kopi Susu"
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="description">Deskripsi</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Deskripsi singkat (opsional)"
                />
              </div>

              <div className="form-row">
                <label htmlFor="price">Harga (Rp)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="category_id">Kategori</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">-- Tanpa Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                </button>
                {editingId && (
                  <button type="button" className="btn-secondary" onClick={cancelEdit}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card card-accent anim-left delay-3">
            <h3>➕ Tambah Kategori Baru</h3>
            <p className="muted small" style={{ marginTop: -6, marginBottom: 10 }}>
              Kategori dibuat di sini, lalu muncul di dropdown produk.
            </p>
            <form onSubmit={handleAddCategory} className="form-row-inline">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nama kategori baru"
              />
              <button type="submit" className="btn-primary" disabled={addingCategory}>
                {addingCategory ? '...' : 'Tambah'}
              </button>
            </form>
            {categories.length > 0 && (
              <p className="muted small">
                {categories.length} kategori tersedia
              </p>
            )}
          </div>
        </aside>

        {/* Kolom kanan: tabel */}
        <section className="layout-main anim-right delay-2">
          <div className="table-card anim-right delay-3">
            <div className="table-head">
              <h3>Daftar Produk</h3>
              <span className="status">
                {loading ? 'Memuat...' : `${products.length} produk`}
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Deskripsi</th>
                    <th>Harga</th>
                    <th>Kategori</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="cell-name">{p.name}</td>
                      <td className="cell-desc">{p.description || '-'}</td>
                      <td className="cell-price">
                        Rp {Number(p.price).toLocaleString('id-ID')}
                      </td>
                      <td>
                        {p.category_name ? (
                          <span className="badge">{p.category_name}</span>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td className="cell-actions">
                        <button className="btn-edit" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(p.id)}>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && products.length === 0 && (
              <div className="empty">Belum ada produk. Tambahkan di panel kiri.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
