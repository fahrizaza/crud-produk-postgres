import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/categories -> list all categories
export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, name FROM categories ORDER BY name ASC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/categories -> create a new category
export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Field "name" wajib diisi' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const { rows } = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id, name',
      [name.trim()]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    // 23505 = unique_violation (nama kategori sudah ada)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Kategori dengan nama tersebut sudah ada' },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
