import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Plus, Search, Edit2, Eye, EyeOff, Save, X } from 'lucide-react';
import {
  useGetAdminProductsQuery,
  useGetAdminCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  type ProductInput,
} from '../../store/api/adminApi';
import { useDebounce } from '../../hooks/useDebounce';
import { LOW_STOCK_THRESHOLD } from '../../constants';
import { apiErrorText } from '../../utils/apiError';
import type { Product } from '../../types';
import './Products.scss';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const EMPTY: ProductInput = {
  name: '', slug: '', description: '', price: 0, compare_price: null, stock: 0,
  category_id: null, image_url: null, featured: false, active: true,
};

type Editable = Pick<Product, 'id' | 'name' | 'price' | 'compare_price' | 'stock'>;

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data, isLoading, isError } = useGetAdminProductsQuery({ search: debounced, limit: 100 });
  const { data: categories } = useGetAdminCategoriesQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  const [editing, setEditing] = useState<Editable | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<ProductInput>(EMPTY);

  const products = data?.data ?? [];

  const save = async (id: string, patch: Partial<ProductInput>, done?: string) => {
    try {
      await updateProduct({ id, patch }).unwrap();
      if (done) toast.success(done);
      return true;
    } catch (err) {
      toast.error(apiErrorText(err));
      return false;
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const { id, ...patch } = editing;
    if (await save(id, patch, 'Product updated')) setEditing(null);
  };

  const handleAdd = async () => {
    try {
      await createProduct({ ...draft, slug: draft.slug || slugify(draft.name) }).unwrap();
      toast.success('Product created');
      setShowAdd(false);
      setDraft(EMPTY);
    } catch (err) {
      toast.error(apiErrorText(err));
    }
  };

  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <div className="admin-products">
      <div className="admin-products__toolbar">
        <div className="admin-products__search">
          <Search size={16} />
          <input placeholder="Search products..." aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="admin-products__add-btn" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showAdd && (
        <motion.div className="admin-products__form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <h3>New Product</h3>
          <div className="admin-products__form-grid">
            <input placeholder="Name" aria-label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <input placeholder={`Slug (${slugify(draft.name) || 'auto'})`} aria-label="Slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            <input placeholder="Price" aria-label="Price" type="number" min="0" step="0.01" value={draft.price || ''} onChange={(e) => setDraft({ ...draft, price: num(e.target.value) })} />
            <input placeholder="Compare price" aria-label="Compare price" type="number" min="0" step="0.01" value={draft.compare_price ?? ''} onChange={(e) => setDraft({ ...draft, compare_price: e.target.value ? Number(e.target.value) : null })} />
            <input placeholder="Stock" aria-label="Stock" type="number" min="0" value={draft.stock || ''} onChange={(e) => setDraft({ ...draft, stock: num(e.target.value) })} />
            <select aria-label="Category" value={draft.category_id ?? ''} onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}>
              <option value="">No category</option>
              {categories?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Image URL" aria-label="Image URL" type="url" value={draft.image_url ?? ''} onChange={(e) => setDraft({ ...draft, image_url: e.target.value || null })} />
            <input placeholder="Description" aria-label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="admin-products__form-actions">
            <button onClick={handleAdd} disabled={!draft.name || creating}><Save size={14} /> Save</button>
            <button onClick={() => setShowAdd(false)}><X size={14} /> Cancel</button>
          </div>
        </motion.div>
      )}

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
            {products.map((product) => {
              const isEditing = editing?.id === product.id;
              return (
                <tr key={product.id}>
                  <td>
                    {isEditing ? (
                      <input aria-label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    ) : (
                      <span className="admin-products__prod-name">{product.name}</span>
                    )}
                  </td>
                  <td>{product.category_name ?? '—'}</td>
                  <td>
                    {isEditing ? (
                      <div className="admin-products__edit-price">
                        <input aria-label="Price" type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: num(e.target.value) })} />
                        <input aria-label="Compare price" type="number" min="0" step="0.01" value={editing.compare_price ?? ''} onChange={(e) => setEditing({ ...editing, compare_price: e.target.value ? Number(e.target.value) : null })} placeholder="Compare" />
                      </div>
                    ) : (
                      <span className="admin-products__price">
                        ${product.price.toFixed(2)}
                        {product.compare_price != null && <span className="admin-products__price-old">${product.compare_price.toFixed(2)}</span>}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input aria-label="Stock" type="number" min="0" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: num(e.target.value) })} style={{ width: 70 }} />
                    ) : (
                      <span className={`admin-products__stock${product.stock <= LOW_STOCK_THRESHOLD ? ' admin-products__stock--low' : ''}`}>
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`admin-products__status${product.active ? ' admin-products__status--active' : ''}`}
                      onClick={() => save(product.id, { active: !product.active })}
                      title={product.active ? 'Hide from the shop' : 'Show in the shop'}
                    >
                      {product.active ? <><Eye size={12} /> Active</> : <><EyeOff size={12} /> Hidden</>}
                    </button>
                  </td>
                  <td>
                    <div className="admin-products__actions">
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveEdit} className="admin-products__action-btn admin-products__action-btn--save" aria-label="Save">
                            <Save size={14} />
                          </button>
                          <button onClick={() => setEditing(null)} className="admin-products__action-btn" aria-label="Cancel">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditing({ id: product.id, name: product.name, price: product.price, compare_price: product.compare_price, stock: product.stock })}
                          className="admin-products__action-btn"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-products__empty">
                  {isError ? 'Could not load products.' : 'No products found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
