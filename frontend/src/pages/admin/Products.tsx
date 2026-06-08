import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Eye, EyeOff, Save, X } from 'lucide-react';
import type { Product } from '../../types';
import './Products.scss';

// Mock admin products (simulates what the API would return)
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Headphones', slug: 'wireless-headphones', description: '', price: 249.99, compare_price: 349.99, stock: 50, category_id: null, category_name: 'Electronics', image_url: null, images: [], featured: true, active: true, rating: 4.7, review_count: 128, created_at: '', updated_at: '' },
  { id: '2', name: 'Merino Sweater', slug: 'merino-sweater', description: '', price: 89.99, compare_price: 119.99, stock: 0, category_id: null, category_name: 'Clothing', image_url: null, images: [], featured: true, active: true, rating: 4.5, review_count: 64, created_at: '', updated_at: '' },
  { id: '3', name: 'Coffee Set', slug: 'coffee-set', description: '', price: 44.99, compare_price: null, stock: 80, category_id: null, category_name: 'Home & Garden', image_url: null, images: [], featured: true, active: true, rating: 4.9, review_count: 41, created_at: '', updated_at: '' },
  { id: '4', name: 'Running Shoes', slug: 'running-shoes', description: '', price: 129.99, compare_price: 159.99, stock: 15, category_id: null, category_name: 'Sports', image_url: null, images: [], featured: true, active: true, rating: 4.3, review_count: 215, created_at: '', updated_at: '' },
  { id: '5', name: 'USB-C Dock', slug: 'usb-c-dock', description: '', price: 79.99, compare_price: 99.99, stock: 65, category_id: null, category_name: 'Electronics', image_url: null, images: [], featured: false, active: false, rating: 4.6, review_count: 89, created_at: '', updated_at: '' },
  { id: '6', name: 'Linen Blazer', slug: 'linen-blazer', description: '', price: 159.99, compare_price: 199.99, stock: 45, category_id: null, category_name: 'Clothing', image_url: null, images: [], featured: false, active: true, rating: 4.4, review_count: 37, created_at: '', updated_at: '' },
  { id: '7', name: 'LED Floor Lamp', slug: 'led-floor-lamp', description: '', price: 119.99, compare_price: null, stock: 3, category_id: null, category_name: 'Home & Garden', image_url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=600', images: [], featured: false, active: true, rating: 4.8, review_count: 53, created_at: '', updated_at: '' },
  { id: '8', name: 'Yoga Mat', slug: 'yoga-mat', description: '', price: 68.99, compare_price: 84.99, stock: 150, category_id: null, category_name: 'Sports', image_url: null, images: [], featured: false, active: true, rating: 4.6, review_count: 92, created_at: '', updated_at: '' },
];

export default function AdminProducts() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    setProducts((prev) => prev.map((p) => (p.id === editing.id ? editing : p)));
    setEditing(null);
  };

  const handleAdd = () => {
    if (!newProduct.name) return;
    const product: Product = {
      id: String(Date.now()),
      name: newProduct.name || '',
      slug: (newProduct.name || '').toLowerCase().replace(/\s+/g, '-'),
      description: '',
      price: newProduct.price || 0,
      compare_price: newProduct.compare_price || null,
      stock: newProduct.stock || 0,
      category_id: null,
      category_name: 'Electronics',
      image_url: null,
      images: [],
      featured: false,
      active: true,
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts((prev) => [...prev, product]);
    setShowAdd(false);
    setNewProduct({});
  };

  return (
    <div className="admin-products">
      <div className="admin-products__toolbar">
        <div className="admin-products__search">
          <Search size={16} />
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="admin-products__add-btn" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div className="admin-products__form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <h3>New Product</h3>
          <div className="admin-products__form-grid">
            <input placeholder="Name" value={newProduct.name || ''} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
            <input placeholder="Price" type="number" value={newProduct.price || ''} onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} />
            <input placeholder="Compare Price" type="number" value={newProduct.compare_price || ''} onChange={(e) => setNewProduct({...newProduct, compare_price: Number(e.target.value)})} />
            <input placeholder="Stock" type="number" value={newProduct.stock || ''} onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
          </div>
          <div className="admin-products__form-actions">
            <button onClick={handleAdd}><Save size={14} /> Save</button>
            <button onClick={() => setShowAdd(false)}><X size={14} /> Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="admin-products__table-wrap">
        <table className="admin-products__table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id}>
                <td>
                  {editing?.id === product.id ? (
                    <input value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})} />
                  ) : (
                    <span className="admin-products__prod-name">{product.name}</span>
                  )}
                </td>
                <td>{product.category_name}</td>
                <td>
                  {editing?.id === product.id ? (
                    <div className="admin-products__edit-price">
                      <input type="number" value={editing.price} onChange={(e) => setEditing({...editing, price: Number(e.target.value)})} />
                      <input type="number" value={editing.compare_price || ''} onChange={(e) => setEditing({...editing, compare_price: e.target.value ? Number(e.target.value) : null})} placeholder="Compare" />
                    </div>
                  ) : (
                    <span className="admin-products__price">
                      ${product.price.toFixed(2)}
                      {product.compare_price && <span className="admin-products__price-old">${product.compare_price.toFixed(2)}</span>}
                    </span>
                  )}
                </td>
                <td>
                  {editing?.id === product.id ? (
                    <input type="number" value={editing.stock} onChange={(e) => setEditing({...editing, stock: Number(e.target.value)})} style={{width: 70}} />
                  ) : (
                    <span className={`admin-products__stock${product.stock <= 5 ? ' admin-products__stock--low' : ''}`}>
                      {product.stock}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className={`admin-products__status${product.active ? ' admin-products__status--active' : ''}`}
                    onClick={() => toggleActive(product.id)}
                  >
                    {product.active ? <><Eye size={12} /> Active</> : <><EyeOff size={12} /> Inactive</>}
                  </button>
                </td>
                <td>
                  <div className="admin-products__actions">
                    {editing?.id === product.id ? (
                      <>
                        <button onClick={handleSaveEdit} className="admin-products__action-btn admin-products__action-btn--save">
                          <Save size={14} />
                        </button>
                        <button onClick={() => setEditing(null)} className="admin-products__action-btn">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditing({...product})} className="admin-products__action-btn">
                          <Edit2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
