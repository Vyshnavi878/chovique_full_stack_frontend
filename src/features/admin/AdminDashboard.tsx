import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Check,
  Edit2,
  UploadCloud,
  X,
  Warehouse,
  ShoppingBag,
  Coins,
  Users,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '../../app/providers';
import { Sidebar } from '../../components/Sidebar';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { Product, OfflineSale, SystemUser } from '../../types';

// SystemUser is imported from types/index.ts

export const AdminDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProductInventory,
    deleteProduct,
    offlineSales,
    setOfflineSales,
    orders,
    addOfflineSale,
    importOfflineSales,
    tickets,
    resolveSupportTicket
  } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileGrid(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Add Product Form Toggling ---
  const [showAddProductForm, setShowAddProductForm] = useState(false);

  // --- Add Product Form State ---
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'dark' as Product['category'],
    price: 0,
    weight: '100g',
    description: '',
    ingredients: '',
    badge: '' as Product['badge'] | '',
    imageFile: null as File | null,
    imagePreviewUrl: '',
    stock: 10,
    calories: '550 kcal',
    totalFat: '35g',
    saturatedFat: '20g',
    cholesterol: '0mg',
    sodium: '15mg',
    totalCarb: '50g',
    protein: '7g',
  });
  const [productAddedSuccess, setProductAddedSuccess] = useState(false);

  // --- Dynamic local state for stock/units sold to keep them interactive ---
  // Stock is now stored in the Product object from backend (product.stock)
  const [productMetrics, setProductMetrics] = useState<{ [productId: string]: { stock: number; sold: number } }>({});

  // --- Inventory Editor State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editWeight, setEditWeight] = useState('');
  const [editStock, setEditStock] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle image file selection — stores the File object for FormData upload.
   * Generates a local object URL for preview only (not sent to backend).
   * The actual file will be sent as multipart/form-data via productService.createProduct().
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      alert('Invalid file format. Please select a JPG, JPEG, PNG, or WebP image.');
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size for image upload is 10 MB.');
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setNewProd(prev => ({ ...prev, imageFile: file, imagePreviewUrl: previewUrl }));
  };

  // Handle adding product — calls productService.createProduct with real FormData
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || newProd.price <= 0) return;

    // Build FormData for multipart/form-data submission to backend
    const formData = new FormData();
    formData.append('name', newProd.name);
    formData.append('category', newProd.category);
    formData.append('price', String(newProd.price));
    formData.append('weight', newProd.weight);
    formData.append('description', newProd.description);
    formData.append('ingredients', newProd.ingredients);
    formData.append('stock', String(newProd.stock));
    if (newProd.badge) formData.append('badge', newProd.badge);
    if (newProd.imageFile) formData.append('image', newProd.imageFile);
    // Nutrition fields
    formData.append('nutrition_calories', newProd.calories);
    formData.append('nutrition_total_fat', newProd.totalFat);
    formData.append('nutrition_saturated_fat', newProd.saturatedFat);
    formData.append('nutrition_cholesterol', newProd.cholesterol);
    formData.append('nutrition_sodium', newProd.sodium);
    formData.append('nutrition_total_carb', newProd.totalCarb);
    formData.append('nutrition_protein', newProd.protein);

    try {
      const created = await productService.createProduct(formData);
      addProduct(created);
    } catch (err: any) {
      console.error('Failed to create product:', err);
      const detail = err?.detail || err?.message || 'Failed to create product. Please try again.';
      alert(detail);
      return;
    }

    setProductAddedSuccess(true);
    setNewProd({
      name: '',
      category: 'dark',
      price: 0,
      weight: '100g',
      description: '',
      ingredients: '',
      badge: '',
      imageFile: null,
      imagePreviewUrl: '',
      stock: 10,
      calories: '550 kcal',
      totalFat: '35g',
      saturatedFat: '20g',
      cholesterol: '0mg',
      sodium: '15mg',
      totalCarb: '50g',
      protein: '7g',
    });
    setTimeout(() => {
      setProductAddedSuccess(false);
      setShowAddProductForm(false);
    }, 2000);
  };

  // Handle inventory edit save — calls inventoryService.updateStock + productService.updateProduct
  const handleSaveInventory = async (productId: string) => {
    try {
      // Update price, weight, and stock via product service
      await productService.updateProduct(productId, { price: editPrice, weight: editWeight, stock: editStock });
      // Update stock log via inventory service
      await inventoryService.updateStock({ product_id: productId, new_stock: editStock, reason: 'Admin manual update' });
      // Update local context
      updateProductInventory(productId, editWeight, editPrice, editStock);
      setProductMetrics((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], stock: editStock },
      }));

    } catch (err: any) {
      console.error('Failed to update inventory:', err);
      const detail = err?.detail || err?.message || 'Failed to update inventory. Please try again.';
      alert(detail);
    }
    setEditingId(null);
  };

  // --- Offline Sales State ---
  const [saleBasket, setSaleBasket] = useState<{ productName: string; quantity: number; totalPrice: number }[]>([]);
  const [manualSale, setManualSale] = useState({
    productName: 'Belgian Dark Truffle Bar',
    quantity: 1,
    totalPrice: 849,
    paymentMethod: 'Cash',
  });
  const [saleAddedSuccess, setSaleAddedSuccess] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Customers Inspector State — fetched from backend on mount ---
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [inspectedCustomer, setInspectedCustomer] = useState<SystemUser | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  useEffect(() => {
    adminService.getUsers()
      .then((users) => setSystemUsers(users))
      .catch((err) => console.error('Failed to fetch users:', err));
  }, []);

  // Trigger file select dialog
  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  /**
   * Handle CSV file upload for bulk offline sales import.
   * Sends the raw CSV file to the backend as multipart/form-data.
   * All CSV parsing is handled server-side.
   */
  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setImporting(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await adminService.importOfflineSales(formData);
      setImportSuccess(true);
      console.log(`Imported ${result.imported} sales records, skipped ${result.skipped}.`);
      // Refresh offline sales list from backend
      adminService.getOfflineSales()
        .then((sales) => setOfflineSales(sales))
        .catch(() => {});
      setTimeout(() => setImportSuccess(false), 4000);
    } catch (err) {
      console.error('CSV upload error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload CSV file.';
      alert(msg);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle manual sales entry - Add to local basket
  const handleAddToBasket = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleBasket(prev => [
      ...prev,
      {
        productName: manualSale.productName,
        quantity: manualSale.quantity,
        totalPrice: manualSale.totalPrice,
      }
    ]);
    // Reset selection quantity
    const selectedProd = products.find(p => p.name === manualSale.productName);
    const price = selectedProd ? selectedProd.price : 0;
    setManualSale(prev => ({
      ...prev,
      quantity: 1,
      totalPrice: price,
    }));
  };

  // Remove item from local basket
  const handleRemoveFromBasket = (index: number) => {
    setSaleBasket(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handle manual batch sales logging — calls adminService.addOfflineSale for each basket item
  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleBasket.length === 0) {
      alert('Please add at least one product to the basket first.');
      return;
    }

    try {
      for (const item of saleBasket) {
        const created = await adminService.addOfflineSale({
          product_name: item.productName,
          quantity: item.quantity,
          total_price: item.totalPrice,
          payment_method: manualSale.paymentMethod,
        });
        addOfflineSale({
          productName: created.productName,
          quantity: created.quantity,
          totalPrice: created.totalPrice,
          paymentMethod: created.paymentMethod,
        });
      }
      setSaleBasket([]);
      setSaleAddedSuccess(true);
      setTimeout(() => setSaleAddedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to log transaction:', err);
      const msg = err instanceof Error ? err.message : 'Failed to log sales.';
      alert(msg);
    }
  };

  // Specific Customer Inspection Details
  const getCustomerOrders = (customerEmail: string) => {
    const nameToMatch = inspectedCustomer ? inspectedCustomer.name.toLowerCase() : '';
    return orders.filter((o: any) =>
      o.shippingAddress.name.toLowerCase() === nameToMatch ||
      o.shippingAddress.phone.includes('98765') // Fallback matching
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Admin Content box */}
      <div className="admin-workspace">
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0 }}>
                Products Catalog
              </h1>
              <Button
                variant="gold"
                glow
                onClick={() => setShowAddProductForm(!showAddProductForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {showAddProductForm ? <X size={16} /> : <Plus size={16} />}
                {showAddProductForm ? 'Cancel Creation' : 'Add Product'}
              </Button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: showAddProductForm ? (isMobileGrid ? '1fr' : '1.4fr 1.1fr') : '1fr',
                gap: '40px',
                alignItems: 'flex-start',
              }}
            >
              {/* Product list Table */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', overflowX: 'auto', background: 'transparent' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Weight</th>
                      <th>Price</th>
                      <th>Available Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const metrics = productMetrics[prod.id] || { stock: 0, sold: 0 };
                      return (
                        <tr key={prod.id}>
                          <td>
                            <img
                              src={prod.image}
                              alt={prod.name}
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </td>
                          <td>{prod.name}</td>
                          <td style={{ textTransform: 'capitalize', color: 'var(--beige)' }}>{prod.category}</td>
                          <td>{prod.weight}</td>
                          <td>₹{prod.price}</td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: metrics.stock < 10 ? 'var(--rose-gold)' : 'var(--cream)',
                              }}
                            >
                              {metrics.stock} units
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${prod.name}?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              style={{ color: 'var(--rose-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Product Form */}
              <AnimatePresence>
                {showAddProductForm && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-panel"
                    style={{
                      padding: '30px',
                      border: '1px solid var(--gold)',
                      background: 'transparent',
                    }}
                  >
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '20px' }}>
                      Create New Chocolate
                    </h3>
                    <form onSubmit={handleAddProduct}>
                      <Input
                        label="Chocolate Name"
                        required
                        value={newProd.name}
                        onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      />

                      <Select
                        label="Category"
                        options={[
                          { value: 'dark', label: 'Dark Collection' },
                          { value: 'milk', label: 'Milk Collection' },
                          { value: 'white', label: 'White Collection' },
                          { value: 'gift', label: 'Gift Boxes & Hampers' },
                          { value: 'beverage', label: 'Beverages' },
                        ]}
                        value={newProd.category}
                        onChange={(e) => setNewProd({ ...newProd, category: e.target.value as any })}
                      />

                      <Select
                        label="Badge / Section Tag"
                        options={[
                          { value: '', label: 'None (Standard Product)' },
                          { value: 'New', label: 'New (Shows in New Arrivals section)' },
                          { value: 'Bestseller', label: 'Bestseller (Shows in Bestsellers section)' },
                          { value: 'Premium', label: 'Premium (Shows in Popular / Premium section)' },
                          { value: 'Gift Hamper', label: 'Gift Hamper (Shows in Gift Hampers section)' },
                          { value: 'Signature', label: 'Signature (Shows in Signature Collection)' },
                          { value: 'Limited', label: 'Limited Edition' },
                        ]}
                        value={newProd.badge || ''}
                        onChange={(e) => setNewProd({ ...newProd, badge: e.target.value as any })}
                      />


                      <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '15px' }}>
                        <Input
                          label="Price (₹)"
                          type="number"
                          required
                          value={newProd.price || ''}
                          onChange={(e) => setNewProd({ ...newProd, price: parseFloat(e.target.value) })}
                        />
                        <Input
                          label="Weight"
                          placeholder="e.g. 150g"
                          required
                          value={newProd.weight}
                          onChange={(e) => setNewProd({ ...newProd, weight: e.target.value })}
                        />
                      </div>

                      {/* File Upload image field */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Product Image File
                        </label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          {newProd.imagePreviewUrl ? (
                            <img
                              src={newProd.imagePreviewUrl}
                              alt="Preview"
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--gold)' }}
                            />
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '4px',
                              border: '1px dashed var(--glass-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--grey-light)',
                              fontSize: '0.7rem'
                            }}>
                              No file
                            </div>
                          )}
                          <div style={{ flexGrow: 1 }}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                              ref={imageInputRef}
                            />
                            <Button
                              variant="glass"
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <UploadCloud size={14} />
                              Choose Image
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Input
                        label="Initial Stock Units"
                        type="number"
                        required
                        min={0}
                        value={newProd.stock}
                        onChange={(e) => setNewProd({ ...newProd, stock: parseInt(e.target.value) || 0 })}
                      />

                      <Input
                        label="Ingredients"
                        placeholder="Ghanaian Cocoa Mass..."
                        value={newProd.ingredients}
                        onChange={(e) => setNewProd({ ...newProd, ingredients: e.target.value })}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Product Description
                        </label>
                        <textarea
                          rows={3}
                          value={newProd.description}
                          onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                          style={{
                            padding: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--cream)',
                            borderRadius: '4px',
                            resize: 'none',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {productAddedSuccess && (
                        <div style={{ padding: '10px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem' }}>
                          ✓ Chocolate catalog item created successfully!
                        </div>
                      )}

                      <Button variant="gold" fullWidth type="submit" glow>
                        Create Product
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Inventory Management
            </h1>

            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Weight Config</th>
                    <th>Price Config</th>
                    <th>Available Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => {
                    const displayStock = prod.stock !== undefined ? prod.stock : (productMetrics[prod.id]?.stock ?? 0);
                    return (
                      <tr key={prod.id}>
                        <td>{prod.name}</td>
                        <td>
                          {editingId === prod.id ? (
                            <input
                              type="text"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              style={{
                                padding: '6px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--gold)',
                                color: 'white',
                                borderRadius: '4px',
                                width: '90px',
                              }}
                            />
                          ) : (
                            prod.weight
                          )}
                        </td>
                        <td>
                          {editingId === prod.id ? (
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                              style={{
                                padding: '6px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--gold)',
                                color: 'white',
                                borderRadius: '4px',
                                width: '90px',
                              }}
                            />
                          ) : (
                            `₹${prod.price}`
                          )}
                        </td>
                        <td>
                          {editingId === prod.id ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                              style={{
                                padding: '6px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--gold)',
                                color: 'white',
                                borderRadius: '4px',
                                width: '90px',
                              }}
                            />
                          ) : (
                            <span style={{ fontWeight: 700, color: displayStock < 10 ? 'var(--rose-gold)' : 'var(--cream)' }}>
                              {displayStock} units
                            </span>
                          )}
                        </td>

                        <td>
                          {editingId === prod.id ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => handleSaveInventory(prod.id)}
                              >
                                Save
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(prod.id);
                                setEditPrice(prod.price);
                                setEditWeight(prod.weight);
                                setEditStock(displayStock);


                              }}
                              style={{ color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit2 size={14} />
                              Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* OFFLINE SALES TAB */}
        {activeTab === 'offline-sales' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Boutique Offline Sales Ledger
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '40px', alignItems: 'flex-start' }}>
              {/* Sales ledger list */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)' }}>
                    Ledger Entries
                  </h3>
                  {/* File Upload Hidden form */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUploadChange}
                    accept=".csv, .txt, .xlsx"
                    style={{ display: 'none' }}
                  />
                  <Button variant="glass" size="sm" onClick={triggerFileSelect} disabled={importing}>
                    <UploadCloud size={16} />
                    {importing ? 'Parsing CSV...' : 'Import CSV Sheet'}
                  </Button>
                </div>

                {importSuccess && (
                  <div style={{ padding: '12px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <CheckCircle size={16} /> File upload parsed! Boutique sales ledger synchronized.
                  </div>
                )}

                <div className="admin-table-wrapper" style={{ overflowY: 'auto', maxHeight: '450px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Receipt ID</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Payment</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offlineSales.map((sale) => (
                        <tr key={sale.id}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>{sale.id}</td>
                          <td>{sale.productName}</td>
                          <td>{sale.quantity}</td>
                          <td>{sale.paymentMethod}</td>
                          <td style={{ fontWeight: 600 }}>₹{sale.totalPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Manual Entry Form */}
              <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--glass-border)', background: 'rgba(26,13,0,0.4)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  Record Offline Sale
                </h3>
                
                {/* Form to add item to basket */}
                <form onSubmit={handleAddToBasket} style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px dashed var(--glass-border)' }}>
                  <Select
                    label="Select Product Sold"
                    value={manualSale.productName}
                    options={products.map((p) => ({ value: p.name, label: p.name }))}
                    onChange={(e) => {
                      const prodName = e.target.value;
                      const selectedProd = products.find((p) => p.name === prodName);
                      const price = selectedProd ? selectedProd.price * manualSale.quantity : 0;
                      setManualSale({ ...manualSale, productName: prodName, totalPrice: price });
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '15px', alignItems: 'end', marginBottom: '15px' }}>
                    <Input
                      label="Quantity"
                      type="number"
                      value={manualSale.quantity}
                      min={1}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        const selectedProd = products.find((p) => p.name === manualSale.productName);
                        const price = selectedProd ? selectedProd.price * qty : 0;
                        setManualSale({ ...manualSale, quantity: qty, totalPrice: price });
                      }}
                      style={{ marginBottom: 0 }}
                    />
                    <Button variant="secondary" type="submit" style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Add to Basket
                    </Button>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--beige)', textAlign: 'right' }}>
                    Item Total: <strong style={{ color: 'var(--gold)' }}>₹{manualSale.totalPrice}</strong>
                  </div>
                </form>

                {/* Basket List & Final Submission */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '12px' }}>
                    Basket Items ({saleBasket.length})
                  </h4>
                  {saleBasket.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', fontStyle: 'italic', marginBottom: '20px' }}>
                      No items added yet. Use the selector above.
                    </p>
                  ) : (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {saleBasket.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.85rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{item.productName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>Qty: {item.quantity} × ₹{item.totalPrice / item.quantity}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <strong style={{ color: 'var(--gold)' }}>₹{item.totalPrice}</strong>
                            <button type="button" onClick={() => handleRemoveFromBasket(idx)} style={{ color: 'var(--rose-gold)', fontSize: '0.75rem' }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '15px' }} />

                  <form onSubmit={handleLogTransaction}>
                    <Select
                      label="Payment Method"
                      value={manualSale.paymentMethod}
                      options={[
                        { value: 'Cash', label: 'Cash payment' },
                        { value: 'Card', label: 'Card Swiped' },
                        { value: 'UPI', label: 'UPI / Scan code' },
                      ]}
                      onChange={(e) => setManualSale({ ...manualSale, paymentMethod: e.target.value })}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0 20px 0' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--beige)' }}>Total Transaction Amount:</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>
                        ₹{saleBasket.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                      </strong>
                    </div>

                    {saleAddedSuccess && (
                      <div style={{ padding: '10px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem' }}>
                        ✓ Offline sales transaction logged successfully!
                      </div>
                    )}

                    <Button variant="gold" fullWidth type="submit" glow disabled={saleBasket.length === 0}>
                      Log Transaction
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div>
            <span className="section-label">Access & Orders</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Customer directory & Inspector
            </h1>

            {/* Split layout: Customers Directory List & Inspector Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
              
              {/* Customer Inspection List */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '15px' }}>
                  Interactive Customer Directory
                </h3>
                <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Click a customer profile card to inspect their complete order history, spend metrics, and verify stock availability.
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <Input
                    placeholder="Search by name, email, or order ID..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(() => {
                    const query = customerSearchQuery.trim().toLowerCase();
                    const filtered = systemUsers.filter(u => u.role === 'customer').filter(cust => {
                      if (!query) return true;
                      const nameMatch = cust.name.toLowerCase().includes(query);
                      const emailMatch = cust.email.toLowerCase().includes(query);
                      
                      // Match order ID
                      const custOrders = orders.filter((o: any) =>
                        o.shippingAddress.name.toLowerCase() === cust.name.toLowerCase()
                      );
                      const orderIdMatch = custOrders.some((o: any) => o.id.toLowerCase().includes(query));

                      return nameMatch || emailMatch || orderIdMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-light)', fontSize: '0.9rem' }}>
                          No matching customers or order numbers found.
                        </div>
                      );
                    }

                    return filtered.map((cust) => {
                      // Get this specific customer's orders
                      const customerOrders = orders.filter((o: any) =>
                        o.shippingAddress.name.toLowerCase() === cust.name.toLowerCase()
                      );
                      const totalSpend = customerOrders.reduce((sum: number, o: any) => sum + o.total, 0);

                      return (
                        <div
                          key={cust.id}
                          onClick={() => setInspectedCustomer(cust)}
                          style={{
                            padding: '16px',
                            background: 'rgba(0,0,0,0.15)',
                            border: inspectedCustomer?.id === cust.id ? '2px solid var(--gold)' : '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => {
                            if (inspectedCustomer?.id !== cust.id) {
                              e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (inspectedCustomer?.id !== cust.id) {
                              e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--chocolate-brown)',
                              color: 'var(--gold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              border: '1px solid var(--gold)',
                            }}>
                              {cust.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, color: 'var(--cream)', fontSize: '1rem', fontWeight: 600 }}>{cust.name}</h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{cust.email}</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>
                              ₹{totalSpend.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                              {customerOrders.length} orders total
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Inspected Customer Detail Card */}
              <AnimatePresence>
                {inspectedCustomer ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    className="glass-panel"
                    style={{
                      padding: '30px',
                      border: '1px solid var(--gold)',
                      background: 'rgba(26,13,0,0.95)',
                      borderRadius: '12px',
                      position: 'relative',
                    }}
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setInspectedCustomer(null)}
                      style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        color: 'var(--grey-light)',
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                      }}
                    >
                      <X size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--chocolate-brown)',
                        color: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '1rem',
                        border: '2px solid var(--gold)',
                      }}>
                        {inspectedCustomer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', margin: 0 }}>
                          {inspectedCustomer.name}
                        </h2>
                        <p style={{ color: 'var(--beige)', fontSize: '0.8rem', margin: 0 }}>{inspectedCustomer.email}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Orders list */}
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                          Customer Order History
                        </h4>

                        {getCustomerOrders(inspectedCustomer.email).length === 0 ? (
                          <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>No orders found for this customer.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                            {getCustomerOrders(inspectedCustomer.email).map((ord: any) => (
                              <div
                                key={ord.id}
                                style={{
                                  padding: '10px 14px',
                                  background: 'rgba(0,0,0,0.15)',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid var(--gold)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.85rem' }}>{ord.id}</span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)', marginLeft: '8px' }}>{ord.date}</span>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)', marginTop: '2px' }}>
                                    Status: <span style={{ color: ord.status === 'Delivered' ? '#2ecc71' : 'var(--gold)', fontWeight: 600 }}>{ord.status}</span>
                                  </div>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.85rem' }}>₹{ord.total.toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Purchased products & stock statuses */}
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                          Items Bought & Stock Status
                        </h4>

                        {getCustomerOrders(inspectedCustomer.email).length === 0 ? (
                          <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>No products purchased.</p>
                        ) : (
                          <div className="admin-table-wrapper" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Qty</th>
                                  <th>In-Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const itemsBought: { [name: string]: { qty: number; available: number; low: boolean } } = {};
                                  getCustomerOrders(inspectedCustomer.email).forEach((o: any) => {
                                    o.items.forEach((it: any) => {
                                      const m = productMetrics[it.product.id] || { stock: 0 };
                                      if (itemsBought[it.product.name]) {
                                        itemsBought[it.product.name].qty += it.quantity;
                                      } else {
                                        itemsBought[it.product.name] = {
                                          qty: it.quantity,
                                          available: m.stock,
                                          low: m.stock < 10
                                        };
                                      }
                                    });
                                  });

                                  return Object.entries(itemsBought).map(([name, data]) => (
                                    <tr key={name}>
                                      <td style={{ fontWeight: 600 }}>{name}</td>
                                      <td>{data.qty}</td>
                                      <td>
                                        <span style={{
                                          color: data.low ? 'var(--rose-gold)' : '#2ecc71',
                                          fontWeight: 700
                                        }}>
                                          {data.available} available
                                        </span>
                                      </td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--glass-border)', color: 'var(--grey-light)', fontSize: '0.9rem' }}>
                    Select a customer card from directory to inspect detailed information.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* SETTINGS AND OTHERS FALLBACK TAB */}
        {!['products', 'inventory', 'offline-sales', 'customers', 'complaints'].includes(activeTab) && (
          <div
            className="glass-panel"
            style={{
              padding: '60px 40px',
              textAlign: 'center',
              border: '1px solid var(--glass-border)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '15px' }}>
              Panel Tab Under Construction
            </h2>
            <p style={{ color: 'var(--beige)', maxWidth: '400px', margin: '0 auto' }}>
              The selected Workspace control tab "{activeTab}" is configured inside navigation, but its sub-panel is empty for mock representation. Use other active tabs.
            </p>
          </div>
        )}

        {/* HELP & COMPLAINTS PANEL */}
        {activeTab === 'complaints' && (
          <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <div>
                    <span className="section-label">Support Helpdesk</span>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0 }}>
                      Customer Support Ledger
                    </h1>
                  </div>
                </div>

                {/* Support Ticket Summary Counters */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Complaints</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>{tickets.length}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Resolution</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--rose-gold)' }}>
                      {tickets.filter(t => t.status === 'Pending').length}
                    </h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolved Issues</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: '#2ecc71' }}>
                      {tickets.filter(t => t.status === 'Resolved').length}
                    </h3>
                  </div>
                </div>

                {/* Support Ticket Directory List */}
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '20px' }}>
                    Support Complaints Log
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {tickets.length === 0 ? (
                      <p style={{ color: 'var(--grey-light)', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                        No customer complaints registered.
                      </p>
                    ) : (
                      tickets.map((t) => {
                        const isPending = t.status === 'Pending';
                        return (
                          <div
                            key={t.id}
                            style={{
                              padding: '20px',
                              background: 'rgba(0,0,0,0.15)',
                              borderRadius: '8px',
                              borderLeft: isPending ? '4px solid var(--gold)' : '4px solid #2ecc71',
                              borderTop: '1px solid var(--glass-border)',
                              borderRight: '1px solid var(--glass-border)',
                              borderBottom: '1px solid var(--glass-border)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                                  {t.id} · {t.category}
                                </span>
                                <h4 style={{ margin: '4px 0 0 0', color: 'var(--cream)', fontSize: '1.1rem' }}>
                                  Customer: {t.customerName} ({t.customerId})
                                </h4>
                              </div>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  background: isPending ? 'rgba(201, 168, 76, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                                  color: isPending ? 'var(--gold)' : '#2ecc71',
                                }}
                              >
                                {t.status}
                              </span>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--beige)', lineHeight: '1.5', margin: '0 0 15px 0' }}>
                              {t.description}
                            </p>

                            {!isPending && t.adminNotes && (
                              <div
                                style={{
                                  padding: '12px',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid var(--glass-border)',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                  color: 'var(--cream)',
                                  marginBottom: '10px',
                                }}
                              >
                                <span style={{ color: 'var(--gold)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                  Admin Resolution Notes:
                                </span>
                                {t.adminNotes}
                              </div>
                            )}

                            {!isPending && t.customerResolutionFeedback && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: t.customerResolutionFeedback === 'Resolved' ? '#2ecc71' : 'var(--rose-gold)', marginTop: '8px' }}>
                                <span style={{ fontWeight: 600 }}>Customer Feedback:</span>
                                <span>{t.customerResolutionFeedback === 'Resolved' ? 'Confirmed Resolved ✓' : 'Reported Unresolved ✗'}</span>
                              </div>
                            )}

                            {isPending && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const input = e.currentTarget.elements.namedItem('notes') as HTMLTextAreaElement;
                                  const notes = input.value;
                                  resolveSupportTicket(t.id, notes);
                                  alert(`Ticket ${t.id} resolved and customer notified.`);
                                }}
                                style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}
                              >
                                <div style={{ marginBottom: '10px' }}>
                                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--grey-light)', marginBottom: '5px' }}>
                                    Resolution Notes (Optional)
                                  </label>
                                  <textarea
                                    name="notes"
                                    placeholder="Enter details of how the issue was resolved (e.g. coupon code sent, refund processed)..."
                                    rows={2}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      background: 'rgba(0,0,0,0.3)',
                                      border: '1px solid var(--glass-border)',
                                      borderRadius: '4px',
                                      color: 'var(--cream)',
                                      fontSize: '0.85rem',
                                      outline: 'none',
                                      resize: 'none',
                                    }}
                                  />
                                </div>
                                <Button variant="gold" size="sm" type="submit" glow>
                                  Resolve & Notify Customer
                                </Button>
                              </form>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
};
export default AdminDashboard;
