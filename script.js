// ===================================
// Configuration & Constants
// ===================================
const API_BASE_URL = 'https://api.escuelajs.co/api/v1';
let PRODUCTS_PER_PAGE = 20; // Default value

// State Management
let currentPage = 1;
let totalProducts = 0;
let allProducts = [];
let filteredProducts = [];
let allCategories = [];
let currentProductId = null;

// DOM Elements
const elements = {
    productsContainer: document.getElementById('productsContainer'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    productCount: document.getElementById('productCount'),
    pagination: document.getElementById('pagination'),
    searchTitle: document.getElementById('searchTitle'),
    categoryFilter: document.getElementById('categoryFilter'),
    priceMin: document.getElementById('priceMin'),
    priceMax: document.getElementById('priceMax'),
    itemsPerPage: document.getElementById('itemsPerPage'),
    sortBy: document.getElementById('sortBy'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    createProductBtn: document.getElementById('createProductBtn')
};

// ===================================
// API Functions
// ===================================

/**
 * Fetch all products from API
 */
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts];
        totalProducts = filteredProducts.length;
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch all categories from API
 */
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        allCategories = data;
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Create a new product
 */
async function createProduct(productData) {
    try {
        console.log('Sending POST request to:', `${API_BASE_URL}/products/`);
        console.log('Request body:', JSON.stringify(productData, null, 2));
        
        const response = await fetch(`${API_BASE_URL}/products/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        
        console.log('Response status:', response.status);
        
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.message || `HTTP ${response.status}: ${JSON.stringify(responseData)}`);
        }
        
        return responseData;
    } catch (error) {
        console.error('Create product failed:', error);
        throw error;
    }
}


/**
 * Update a product
 */
async function updateProduct(id, productData) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Failed to update product');
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// ===================================
// UI Functions
// ===================================

/**
 * Show loading spinner
 */
function showLoading() {
    elements.loadingSpinner.classList.remove('d-none');
    elements.productsContainer.innerHTML = '';
    elements.errorMessage.classList.add('d-none');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    elements.loadingSpinner.classList.add('d-none');
}

/**
 * Show error message
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('d-none');
    elements.loadingSpinner.classList.add('d-none');
}

/**
 * Update product count display
 */
function updateProductCount() {
    elements.productCount.textContent = `${totalProducts} sản phẩm`;
}

/**
 * Get category icon based on category name
 */
function getCategoryIcon(categoryName) {
    const iconMap = {
        'Clothes': 'bi-bag',
        'Electronics': 'bi-laptop',
        'Furniture': 'bi-house-door',
        'Shoes': 'bi-shoe',
        'Miscellaneous': 'bi-box-seam'
    };
    
    return iconMap[categoryName] || 'bi-tag';
}

/**
 * Create HTML for a single product card
 */
function createProductCard(product) {
    // Get first valid image URL
    let imageUrl = 'https://via.placeholder.com/400x400?text=No+Image';
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Try to find a valid image URL
        const validImage = product.images.find(img => {
            if (typeof img === 'string' && img.trim() !== '') {
                // Check if it's a valid URL
                try {
                    new URL(img);
                    return true;
                } catch (e) {
                    return false;
                }
            }
            return false;
        });
        
        if (validImage) {
            imageUrl = validImage;
        }
    }
    
    const categoryName = product.category?.name || 'Uncategorized';
    const categoryIcon = getCategoryIcon(categoryName);
    
    return `
        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="product-card" onclick="showProductDetail(${product.id})" style="cursor: pointer;">
                <div class="product-image-wrapper">
                    <span class="product-badge">ID: ${product.id}</span>
                    <img src="${imageUrl}" 
                         alt="${escapeHtml(product.title)}" 
                         class="product-image"
                         referrerpolicy="no-referrer"
                         crossorigin="anonymous"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x400?text=Image+Error'">
                </div>
                <div class="product-body">
                    <span class="product-category">
                        <i class="bi ${categoryIcon}"></i>
                        ${escapeHtml(categoryName)}
                    </span>
                    <h3 class="product-title">${escapeHtml(product.title)}</h3>
                    <p class="product-description">${escapeHtml(product.description || 'Không có mô tả')}</p>
                    <div class="product-footer">
                        <span class="product-price">$${product.price}</span>
                        <span class="product-id">
                            <i class="bi bi-tag"></i> #${product.id}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}


/**
 * Render pagination controls
 */
function renderPagination() {
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
    
    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i> Trước
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                Sau <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    elements.pagination.innerHTML = paginationHTML;
}

/**
 * Render products for current page
 */
function renderProducts() {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    if (productsToShow.length === 0) {
        elements.productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc;"></i>
                <p class="text-muted mt-3">Không tìm thấy sản phẩm nào</p>
            </div>
        `;
        return;
    }
    
    elements.productsContainer.innerHTML = productsToShow.map(product => createProductCard(product)).join('');
}

/**
 * Change page
 */
function changePage(page) {
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
    renderPagination();
    
    // Scroll to top of products section
    window.scrollTo({
        top: document.querySelector('.products-section').offsetTop - 100,
        behavior: 'smooth'
    });
}

/**
 * Populate category filter dropdown
 */
function populateCategoryFilter() {
    const options = allCategories.map(category => 
        `<option value="${category.id}">${escapeHtml(category.name)}</option>`
    ).join('');
    
    elements.categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' + options;
    
    // Also populate modal category selects
    document.getElementById('editCategoryId').innerHTML = options;
    document.getElementById('createCategoryId').innerHTML = options;
}

// ===================================
// Filter & Sort Functions
// ===================================

/**
 * Apply filters to products
 */
function applyFilters() {
    const searchText = elements.searchTitle.value.toLowerCase().trim();
    const categoryId = elements.categoryFilter.value;
    const minPrice = parseFloat(elements.priceMin.value) || 0;
    const maxPrice = parseFloat(elements.priceMax.value) || Infinity;
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchText || product.title.toLowerCase().includes(searchText);
        const matchesCategory = !categoryId || product.category?.id === parseInt(categoryId);
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    // Apply sorting
    applySorting();
    
    totalProducts = filteredProducts.length;
    currentPage = 1;
    
    updateProductCount();
    renderProducts();
    renderPagination();
    
    // Scroll to products section
    window.scrollTo({
        top: document.querySelector('.products-section').offsetTop - 100,
        behavior: 'smooth'
    });
}

/**
 * Apply sorting to filtered products
 */
function applySorting() {
    const sortValue = elements.sortBy.value;
    
    if (!sortValue) return;
    
    switch(sortValue) {
        case 'title':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'price':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
    }
}

// ===================================
// Export Functions
// ===================================

/**
 * Export current view to CSV
 */
function exportToCSV() {
    // Get products from current view
    const productsToExport = filteredProducts;
    
    if (productsToExport.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    
    // CSV Header
    const headers = ['ID', 'Title', 'Price', 'Description', 'Category', 'Images'];
    
    // CSV Rows
    const rows = productsToExport.map(product => [
        product.id,
        `"${(product.title || '').replace(/"/g, '""')}"`,
        product.price,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        `"${(product.category?.name || '').replace(/"/g, '""')}"`,
        `"${(product.images || []).join(', ').replace(/"/g, '""')}"`
    ]);
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===================================
// Modal Functions
// ===================================

/**
 * Show product detail modal
 */
function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentProductId = productId;
    
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/400x400?text=No+Image';
    
    const detailHTML = `
        <div class="row">
            <div class="col-md-5">
                <img src="${imageUrl}" class="img-fluid rounded" alt="${escapeHtml(product.title)}"
                     referrerpolicy="no-referrer" crossorigin="anonymous"
                     onerror="this.src='https://via.placeholder.com/400x400?text=Image+Error'">
            </div>
            <div class="col-md-7">
                <h4>${escapeHtml(product.title)}</h4>
                <p class="text-muted">ID: ${product.id}</p>
                <hr>
                <p><strong>Giá:</strong> $${product.price}</p>
                <p><strong>Danh mục:</strong> ${escapeHtml(product.category?.name || 'N/A')}</p>
                <p><strong>Mô tả:</strong></p>
                <p>${escapeHtml(product.description || 'Không có mô tả')}</p>
                <p><strong>Ảnh:</strong></p>
                <div class="d-flex gap-2 flex-wrap">
                    ${(product.images || []).map((img, index) => `
                        <img src="${img}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;"
                             referrerpolicy="no-referrer" crossorigin="anonymous"
                             onerror="this.src='https://via.placeholder.com/80x80?text=Error'">
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('productDetailBody').innerHTML = detailHTML;
    
    const modal = new bootstrap.Modal(document.getElementById('productDetailModal'));
    modal.show();
}

/**
 * Show edit product modal
 */
function showEditModal() {
    const product = allProducts.find(p => p.id === currentProductId);
    if (!product) return;
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editTitle').value = product.title;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editCategoryId').value = product.category?.id || '';
    document.getElementById('editImages').value = (product.images || []).join(', ');
    
    // Hide detail modal
    bootstrap.Modal.getInstance(document.getElementById('productDetailModal')).hide();
    
    // Show edit modal
    const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
    modal.show();
}

/**
 * Save edited product
 */
async function saveEditedProduct() {
    const productId = parseInt(document.getElementById('editProductId').value);
    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value.trim();
    const categoryId = parseInt(document.getElementById('editCategoryId').value);
    const imagesText = document.getElementById('editImages').value.trim();
    
    if (!title || !price || !categoryId) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    // Parse images - ensure valid URLs
    let images = [];
    if (imagesText) {
        images = imagesText.split(',').map(url => url.trim()).filter(url => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        });
    }
    
    // If no valid images, use placeholder
    if (images.length === 0) {
        images = ['https://i.imgur.com/placeholder.jpg'];
    }
    
    const productData = {
        title,
        price,
        description: description || 'No description',
        categoryId,
        images
    };
    
    console.log('Updating product:', productData);
    
    try {
        const updatedProduct = await updateProduct(productId, productData);
        
        console.log('Product updated:', updatedProduct);
        
        // Update local data
        const index = allProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updatedProduct };
        }
        
        // Reapply filters and render
        applyFilters();
        
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        
        alert('Cập nhật sản phẩm thành công!');
    } catch (error) {
        console.error('Update product error:', error);
        alert('Lỗi khi cập nhật sản phẩm: ' + error.message);
    }
}


/**
 * Show create product modal
 */
function showCreateModal() {
    document.getElementById('createProductForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('createProductModal'));
    modal.show();
}

/**
 * Save new product
 */
async function saveNewProduct() {
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const imagesText = document.getElementById('createImages').value.trim();
    
    if (!title || !price || !categoryId) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    // Parse images - ensure valid URLs
    let images = ['https://i.imgur.com/placeholder.jpg'];
    if (imagesText) {
        const parsedImages = imagesText.split(',').map(url => url.trim()).filter(url => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        });
        if (parsedImages.length > 0) {
            images = parsedImages;
        }
    }
    
    const productData = {
        title,
        price,
        description: description || 'No description',
        categoryId,
        images
    };
    
    console.log('Creating product:', productData);
    
    try {
        const newProduct = await createProduct(productData);
        
        console.log('Product created:', newProduct);
        
        // Add to local data
        allProducts.unshift(newProduct);
        
        // Reapply filters and render
        applyFilters();
        
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('createProductModal')).hide();
        
        alert('Tạo sản phẩm thành công!');
    } catch (error) {
        console.error('Create product error:', error);
        alert('Lỗi khi tạo sản phẩm: ' + error.message + '\n\nLưu ý: API có thể yêu cầu URL ảnh hợp lệ (imgur, etc)');
    }
}


// ===================================
// Utility Functions
// ===================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// Event Listeners
// ===================================

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Real-time search on input change
    elements.searchTitle.addEventListener('input', applyFilters);
    
    // Enter key on filter inputs
    [elements.categoryFilter, elements.priceMin, elements.priceMax].forEach(element => {
        element.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    });
    
    // Auto-apply filters on category change
    elements.categoryFilter.addEventListener('change', applyFilters);
    
    // Sort change
    elements.sortBy.addEventListener('change', applyFilters);
    
    // Items per page change
    elements.itemsPerPage.addEventListener('change', () => {
        PRODUCTS_PER_PAGE = parseInt(elements.itemsPerPage.value);
        currentPage = 1; // Reset to first page
        renderProducts();
        renderPagination();
    });
    
    // Export CSV button
    elements.exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Create product button
    elements.createProductBtn.addEventListener('click', showCreateModal);
    
    // Edit product button in detail modal
    document.getElementById('editProductBtn').addEventListener('click', showEditModal);
    
    // Save edit button
    document.getElementById('saveEditBtn').addEventListener('click', saveEditedProduct);
    
    // Save create button
    document.getElementById('saveCreateBtn').addEventListener('click', saveNewProduct);
}

// ===================================
// Initialization
// ===================================

/**
 * Initialize the application
 */
async function init() {
    try {
        showLoading();
        
        console.log('Initializing Platzi Store...');
        
        // Fetch data
        await Promise.all([
            fetchProducts(),
            fetchCategories()
        ]);
        
        console.log(`Platzi Store initialized successfully!`);
        console.log(`Loaded ${allProducts.length} products`);
        console.log(`Loaded ${allCategories.length} categories`);
        
        // Populate UI
        populateCategoryFilter();
        updateProductCount();
        renderProducts();
        renderPagination();
        
        // Initialize event listeners
        initEventListeners();
        
        hideLoading();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
