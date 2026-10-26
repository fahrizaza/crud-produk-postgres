import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Postgres menolak parameter teks pada kolom integer, jadi id divalidasi
// lebih dulu supaya id tidak valid tetap menghasilkan 404 (bukan 500).
function toId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/products/:id -> get one product (beserta kategori)
export async function GET(request, { params }) {
  try {
    const id = toId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT
         p.id, p.name, p.description, p.price, p.category_id,
         c.name AS category_name, p.created_at
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/products/:id -> update a product
export async function PUT(request, { params }) {
  try {
    const id = toId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, price, category_id } = body;

    if (!name || price === undefined || price === '') {
      return NextResponse.json(
        { error: 'Field "name" dan "price" wajib diisi' },
        { status: 400 }
      );
    }

    const categoryId = category_id ? Number(category_id) : null;

    const pool = getPool();
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, category_id = $4 WHERE id = $5',
      [name, description || null, price, categoryId, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id,
      name,
      description: description || null,
      price,
      category_id: categoryId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/products/:id -> delete a product
export async function DELETE(request, { params }) {
  try {
    const id = toId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const pool = getPool();
    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
