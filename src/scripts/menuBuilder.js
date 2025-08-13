/**
 * Menu Builder - Clase principal para manejar la funcionalidad del constructor de menús
 */
export class MenuBuilder {
  constructor() {
    // Global data storage
    this.categories = [];
    this.products = [];
    this.modifiers = [];
    this.currentOptions = [];
    this.currentStep = 1;

    this.init();
  }

  /**
   * Guarda todos los datos en localStorage
   */
  saveToLocalStorage() {
    const data = {
      categories: this.categories,
      products: this.products,
      modifiers: this.modifiers,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('menuBuilderData', JSON.stringify(data));
  }

  /**
   * Carga los datos desde localStorage
   */
  loadFromLocalStorage() {
    const savedData = localStorage.getItem('menuBuilderData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        this.categories = data.categories || [];
        this.products = data.products || [];
        this.modifiers = data.modifiers || [];
        
        // Actualizar las tablas con los datos cargados
        this.updateCategoriesTable();
        this.updateProductsTable();
        this.updateModifiersTable();
        
        this.showToast('Datos cargados correctamente');
      } catch (error) {
        console.error('Error al cargar datos:', error);
        this.showToast('Error al cargar los datos guardados', 'error');
      }
    }
  }

  /**
   * Inicializa la aplicación
   */
  init() {
    this.bindEvents();
    this.loadFromLocalStorage();
    this.showStep(1);
  }

  /**
   * Vincula todos los eventos de la aplicación
   */
  bindEvents() {
    // Step navigation
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = parseInt(e.target.dataset.step);
        this.showStep(step);
      });
    });

    // Category events
    document.getElementById('add-category-btn')?.addEventListener('click', () => this.addCategory());
    document.getElementById('category-name')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory();
    });

    // Product events
    document.getElementById('add-product-btn')?.addEventListener('click', () => this.addProduct());
    document.getElementById('product-image')?.addEventListener('input', () => this.updateImagePreview());

    // Modifier events
    document.getElementById('add-option-btn')?.addEventListener('click', () => this.addOption());
    document.getElementById('save-modifier-btn')?.addEventListener('click', () => this.saveModifier());

    // Export events
    document.getElementById('copy-json-btn')?.addEventListener('click', () => this.copyJSON());
    document.getElementById('download-json-btn')?.addEventListener('click', () => this.downloadJSON());
    document.getElementById('clear-data-btn')?.addEventListener('click', () => this.clearAllData());
    document.getElementById('import-json-btn')?.addEventListener('click', () => this.importJSON());
  }

  /**
   * Muestra una notificación toast
   */
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg transform transition-transform duration-300 z-50 ${
      type === 'success' ? 'bg-[#fb0021]' : 'bg-red-500'
    } text-white`;
    
    toast.style.transform = 'translateX(0)';
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
    }, 3000);
  }

  /**
   * Navegación entre pasos
   */
  showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
      step.classList.add('hidden');
    });
    
    // Show selected step
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
      targetStep.classList.remove('hidden');
    }
    
    // Update button styles
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.className = 'step-btn px-4 py-2 rounded-md font-medium transition-colors text-gray-600 hover:text-primary';
    });
    
    const activeBtn = document.querySelector(`[data-step="${stepNumber}"]`);
    if (activeBtn) {
      activeBtn.className = 'step-btn px-4 py-2 rounded-md font-medium transition-colors bg-primary text-white';
    }

    this.currentStep = stepNumber;
    
    // Update dropdowns and preview when switching steps
    if (stepNumber === 2) this.updateProductCategoryDropdown();
    if (stepNumber === 3) this.updateModifierProductDropdown();
    if (stepNumber === 4) this.updatePreview();
    if (stepNumber === 5) this.updateJSONOutput();
  }

  // ========== CATEGORY FUNCTIONS ==========

  /**
   * Agrega una nueva categoría
   */
  addCategory() {
    const nameInput = document.getElementById('category-name');
    const name = nameInput?.value.trim();
    
    if (!name) {
      this.showToast('Por favor ingresa un nombre para la categoría', 'error');
      return;
    }
    
    if (this.categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      this.showToast('Ya existe una categoría con ese nombre', 'error');
      return;
    }
    
    const category = {
      id: Date.now(),
      name: name
    };
    
    this.categories.push(category);
    nameInput.value = '';
    this.updateCategoriesTable();
    this.saveToLocalStorage();
    this.showToast('Categoría agregada exitosamente');
  }

  /**
   * Actualiza la tabla de categorías
   */
  updateCategoriesTable() {
    const tbody = document.getElementById('categories-table');
    if (!tbody) return;
    
    if (this.categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="text-center py-8 text-gray-500">No hay categorías creadas</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.categories.map(category => {
      const productsCount = this.products.filter(prod => prod.categoryId === category.id).length;
      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="py-3 px-4">
            <div class="font-medium">${category.name}</div>
            ${productsCount > 0 ? 
              `<span class="text-xs text-gray-500">${productsCount} producto${productsCount !== 1 ? 's' : ''}</span>` : 
              ''}
          </td>
          <td class="py-3 px-4">
            <button onclick="menuBuilder.deleteCategory(${category.id})" class="text-red-600 hover:text-red-800 font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Elimina una categoría
   */
  deleteCategory(id) {
    this.categories = this.categories.filter(cat => cat.id !== id);
    this.products = this.products.filter(prod => prod.categoryId !== id);
    this.modifiers = this.modifiers.filter(mod => !this.products.some(prod => prod.id === mod.productId));
    this.updateCategoriesTable();
    this.updateProductsTable();
    this.updateModifiersTable();
    this.saveToLocalStorage();
    this.showToast('Categoría eliminada');
  }

  // ========== PRODUCT FUNCTIONS ==========

  /**
   * Actualiza el dropdown de categorías para productos
   */
  updateProductCategoryDropdown() {
    const select = document.getElementById('product-category');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar categoría</option>' +
      this.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
  }

  /**
   * Actualiza la vista previa de imagen
   */
  updateImagePreview() {
    const imageUrl = document.getElementById('product-image')?.value;
    const preview = document.getElementById('image-preview');
    const placeholder = document.getElementById('image-placeholder');
    
    if (!preview || !placeholder) return;

    if (imageUrl) {
      preview.src = imageUrl;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      preview.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
  }

  /**
   * Agrega un nuevo producto
   */
  addProduct() {
    const categoryId = parseInt(document.getElementById('product-category')?.value);
    const name = document.getElementById('product-name')?.value.trim();
    const description = document.getElementById('product-description')?.value.trim();
    const price = parseFloat(document.getElementById('product-price')?.value);
    const image = document.getElementById('product-image')?.value.trim();
    
    if (!categoryId) {
      this.showToast('Por favor selecciona una categoría', 'error');
      return;
    }
    
    if (!name) {
      this.showToast('Por favor ingresa un nombre para el producto', 'error');
      return;
    }
    
    if (!description) {
      this.showToast('Por favor ingresa una descripción', 'error');
      return;
    }
    
    if (isNaN(price) || price < 0) {
      this.showToast('Por favor ingresa un precio válido', 'error');
      return;
    }
    
    const product = {
      id: Date.now(),
      categoryId: categoryId,
      name: name,
      description: description,
      price: price,
      image: image
    };
    
    this.products.push(product);
    
    // Clear form
    ['product-category', 'product-name', 'product-description', 'product-price', 'product-image']
      .forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
      });
    
    this.updateImagePreview();
    this.updateProductsTable();
    this.saveToLocalStorage();
    this.showToast('Producto agregado exitosamente');
  }

  /**
   * Actualiza la tabla de productos
   */
  updateProductsTable() {
    const tbody = document.getElementById('products-table');
    if (!tbody) return;
    
    if (this.products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No hay productos creados</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.products.map(product => {
      const category = this.categories.find(cat => cat.id === product.categoryId);
      const hasModifiers = this.modifiers.some(mod => mod.productId === product.id);
      
      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="py-3 px-4">
            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
              ${category ? category.name : 'N/A'}
            </span>
          </td>
          <td class="py-3 px-4">
            <div class="font-medium">${product.name}</div>
            ${hasModifiers ? 
              '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Con modificadores</span>' : 
              ''}
          </td>
          <td class="py-3 px-4 text-sm text-gray-600">
            <div class="max-w-xs truncate">${product.description}</div>
          </td>
          <td class="py-3 px-4">
            <span class="font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
              L. ${product.price.toFixed(2)}
            </span>
          </td>
          <td class="py-3 px-4">
            ${product.image ? 
              `<img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded shadow">` : 
              '<span class="text-xs text-gray-500 italic">Sin imagen</span>'}
          </td>
          <td class="py-3 px-4">
            <button onclick="menuBuilder.deleteProduct(${product.id})" class="text-red-600 hover:text-red-800 font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Elimina un producto
   */
  deleteProduct(id) {
    this.products = this.products.filter(prod => prod.id !== id);
    this.modifiers = this.modifiers.filter(mod => mod.productId !== id);
    this.updateProductsTable();
    this.updateModifiersTable();
    this.saveToLocalStorage();
    this.showToast('Producto eliminado');
  }

  // ========== MODIFIER FUNCTIONS ==========

  /**
   * Actualiza el dropdown de productos para modificadores
   */
  updateModifierProductDropdown() {
    const select = document.getElementById('modifier-product');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar producto</option>' +
      this.products.map(prod => `<option value="${prod.id}">${prod.name}</option>`).join('');
  }

  /**
   * Agrega una opción al modificador actual
   */
  addOption() {
    const label = document.getElementById('option-label')?.value.trim();
    const value = parseFloat(document.getElementById('option-value')?.value) || 0;
    
    if (!label) {
      this.showToast('Por favor ingresa una etiqueta para la opción', 'error');
      return;
    }
    
    const option = {
      id: Date.now(),
      label: label,
      value: value
    };
    
    this.currentOptions.push(option);
    
    ['option-label', 'option-value'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    
    this.updateOptionsList();
    this.showToast('Opción agregada');
  }

  /**
   * Actualiza la lista de opciones
   */
  updateOptionsList() {
    const container = document.getElementById('options-list');
    if (!container) return;
    
    if (this.currentOptions.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm">No hay opciones agregadas</p>';
      return;
    }
    
    container.innerHTML = this.currentOptions.map(option => `
      <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
        <span class="text-sm">${option.label} - L. ${option.value.toFixed(2)}</span>
        <button onclick="menuBuilder.removeOption(${option.id})" class="text-red-600 hover:text-red-800 text-sm">
          Eliminar
        </button>
      </div>
    `).join('');
  }

  /**
   * Remueve una opción del modificador actual
   */
  removeOption(id) {
    this.currentOptions = this.currentOptions.filter(opt => opt.id !== id);
    this.updateOptionsList();
  }

  /**
   * Guarda el modificador actual
   */
  saveModifier() {
    const productId = parseInt(document.getElementById('modifier-product')?.value);
    const name = document.getElementById('modifier-name')?.value.trim();
    const min = parseInt(document.getElementById('modifier-min')?.value);
    const max = parseInt(document.getElementById('modifier-max')?.value);
    const type = parseInt(document.querySelector('input[name="modifier-type"]:checked')?.value);
    const position = parseInt(document.getElementById('modifier-position')?.value);
    
    if (!productId) {
      this.showToast('Por favor selecciona un producto', 'error');
      return;
    }
    
    if (!name) {
      this.showToast('Por favor ingresa un nombre para el modificador', 'error');
      return;
    }
    
    if (min > max) {
      this.showToast('El mínimo no puede ser mayor que el máximo', 'error');
      return;
    }
    
    if (this.currentOptions.length === 0) {
      this.showToast('Por favor agrega al menos una opción', 'error');
      return;
    }
    
    const modifier = {
      id: Date.now(),
      productId: productId,
      name: name,
      min: min,
      max: max,
      type: type,
      position: position,
      options: [...this.currentOptions]
    };
    
    this.modifiers.push(modifier);
    
    // Clear form
    ['modifier-product', 'modifier-name'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    
    document.getElementById('modifier-min').value = '0';
    document.getElementById('modifier-max').value = '1';
    document.querySelector('input[name="modifier-type"][value="1"]').checked = true;
    document.getElementById('modifier-position').value = '1';
    
    this.currentOptions = [];
    this.updateOptionsList();
    this.updateModifiersTable();
    this.saveToLocalStorage();
    this.showToast('Modificador guardado exitosamente');
  }

  /**
   * Actualiza la tabla de modificadores
   */
  updateModifiersTable() {
    const tbody = document.getElementById('modifiers-table');
    if (!tbody) return;
    
    if (this.modifiers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No hay modificadores creados</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.modifiers.map(modifier => {
      const product = this.products.find(prod => prod.id === modifier.productId);
      const typeLabel = modifier.type === 1 ? 
        '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Único</span>' : 
        '<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Múltiple</span>';
      
      const minMaxText = modifier.min === 0 ? 
        `Opcional (0-${modifier.max})` : 
        (modifier.min === modifier.max ? 
          `Exacto (${modifier.min})` : 
          `${modifier.min}-${modifier.max}`);
      
      return `
        <tr class="border-b border-gray-100">
          <td class="py-3 px-4">
            <div class="font-medium">${product ? product.name : 'N/A'}</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-medium">${modifier.name}</div>
            <div class="text-xs text-gray-500">Posición: ${modifier.position}</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-medium">${minMaxText}</div>
          </td>
          <td class="py-3 px-4">${typeLabel}</td>
          <td class="py-3 px-4">
            <div class="max-h-24 overflow-y-auto">
              ${modifier.options.length > 0 ? 
                `<ul class="list-disc ml-4 text-sm text-gray-600">
                  ${modifier.options.map(opt => 
                    `<li>${opt.label} ${opt.value > 0 ? `<span class="font-medium">+L. ${opt.value.toFixed(2)}</span>` : ''}</li>`
                  ).join('')}
                </ul>` : 
                '<span class="text-gray-500 text-sm">Sin opciones</span>'
              }
            </div>
          </td>
          <td class="py-3 px-4">
            <button onclick="menuBuilder.deleteModifier(${modifier.id})" class="text-red-600 hover:text-red-800 font-medium">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Elimina un modificador
   */
  deleteModifier(id) {
    this.modifiers = this.modifiers.filter(mod => mod.id !== id);
    this.updateModifiersTable();
    this.saveToLocalStorage();
    this.showToast('Modificador eliminado');
  }

  // ========== PREVIEW FUNCTIONS ==========

  /**
   * Actualiza la vista previa
   */
  updatePreview() {
    const container = document.getElementById('preview-content');
    if (!container) return;
    
    if (this.categories.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay datos para mostrar</p>';
      return;
    }
    
    const groupedData = this.categories.map(category => {
      const categoryProducts = this.products.filter(prod => prod.categoryId === category.id);
      return {
        category,
        products: categoryProducts.map(product => ({
          ...product,
          modifiers: this.modifiers.filter(mod => mod.productId === product.id)
        }))
      };
    }).filter(group => group.products.length > 0);
    
    if (groupedData.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay productos para mostrar</p>';
      return;
    }
    
    container.innerHTML = groupedData.map(group => `
      <div class="border rounded-lg overflow-hidden">
        <button onclick="menuBuilder.toggleCategory('category-${group.category.id}')" 
                class="w-full bg-gray-100 px-4 py-3 text-left font-semibold text-gray-800 hover:bg-gray-200 transition-colors flex justify-between items-center">
          <span>${group.category.name} (${group.products.length} productos)</span>
          <svg class="w-5 h-5 transform transition-transform" id="icon-category-${group.category.id}">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        <div id="category-${group.category.id}" class="hidden">
          ${group.products.map(product => `
            <div class="border-t p-4">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800">${product.name}</h4>
                  <p class="text-gray-600 text-sm">${product.description}</p>
                  <p class="font-semibold text-primary mt-1">L. ${product.price.toFixed(2)}</p>
                </div>
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded ml-4">` : ''}
              </div>
              ${product.modifiers.length > 0 ? `
                <div class="mt-3 pl-4 border-l-2 border-gray-200">
                  <h5 class="font-medium text-gray-700 mb-2">Modificadores:</h5>
                  ${product.modifiers.map(modifier => `
                    <div class="mb-2">
                      <p class="text-sm font-medium text-gray-600">
                        ${modifier.name} (${modifier.min}-${modifier.max}, ${modifier.type === 1 ? 'Único' : 'Múltiple'})
                      </p>
                      <div class="ml-4 text-sm text-gray-500">
                        ${modifier.options.map(opt => `${opt.label}: L. ${opt.value.toFixed(2)}`).join(', ')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Toggle de categoría en la vista previa
   */
  toggleCategory(categoryId) {
    const element = document.getElementById(categoryId);
    const icon = document.getElementById(`icon-${categoryId}`);
    
    if (element && icon) {
      element.classList.toggle('hidden');
      icon.style.transform = element.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }

  /**
   * Limpia todos los datos guardados
   */
  clearAllData() {
    if (confirm('¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.')) {
      this.categories = [];
      this.products = [];
      this.modifiers = [];
      this.currentOptions = [];
      
      // Actualizar tablas
      this.updateCategoriesTable();
      this.updateProductsTable();
      this.updateModifiersTable();
      
      // Limpiar localStorage
      localStorage.removeItem('menuBuilderData');
      
      this.showToast('Todos los datos han sido eliminados');
    }
  }

  // ========== EXPORT FUNCTIONS ==========

  /**
   * Genera el JSON de exportación
   */
  generateJSON() {
    const menu = this.categories.map(category => {
      const categoryProducts = this.products.filter(prod => prod.categoryId === category.id);
      
      if (categoryProducts.length === 0) return null;
      
      return {
        id: category.id,
        name: category.name,
        products: categoryProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image || null,
          modifiers: this.modifiers
            .filter(mod => mod.productId === product.id)
            .map(modifier => ({
              id: modifier.id,
              name: modifier.name,
              min: modifier.min,
              max: modifier.max,
              type: modifier.type,
              position: modifier.position,
              options: modifier.options.map(option => ({
                id: option.id,
                label: option.label,
                value: option.value
              }))
            }))
        }))
      };
    }).filter(Boolean);

    return {
      menu,
      metadata: {
        created: new Date().toISOString(),
        totalCategories: this.categories.length,
        totalProducts: this.products.length,
        totalModifiers: this.modifiers.length
      }
    };
  }

  /**
   * Actualiza la salida JSON
   */
  updateJSONOutput() {
    const output = document.getElementById('json-output');
    if (!output) return;
    
    const jsonData = this.generateJSON();
    output.textContent = JSON.stringify(jsonData, null, 2);
  }

  /**
   * Copia el JSON al portapapeles
   */
  async copyJSON() {
    const jsonData = this.generateJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    try {
      await navigator.clipboard.writeText(jsonString);
      this.showToast('JSON copiado al portapapeles');
    } catch (err) {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast('JSON copiado al portapapeles');
    }
  }

  /**
   * Descarga el JSON como archivo
   */
  downloadJSON() {
    const jsonData = this.generateJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('JSON descargado exitosamente');
  }

  /**
   * Importa datos de un JSON
   */
  importJSON() {
    const jsonInput = document.getElementById('import-json');
    const jsonString = jsonInput?.value.trim();
    
    if (!jsonString) {
      this.showToast('Por favor ingresa un JSON válido', 'error');
      return;
    }
    
    try {
      const jsonData = JSON.parse(jsonString);
      
      if (!jsonData.menu || !Array.isArray(jsonData.menu)) {
        this.showToast('El formato del JSON no es válido', 'error');
        return;
      }
      
      // Limpiamos los datos actuales
      this.categories = [];
      this.products = [];
      this.modifiers = [];
      
      // Importamos las categorías
      jsonData.menu.forEach(category => {
        this.categories.push({
          id: category.id || Date.now(),
          name: category.name
        });
        
        // Importamos los productos
        if (category.products && Array.isArray(category.products)) {
          category.products.forEach(product => {
            this.products.push({
              id: product.id || Date.now(),
              categoryId: category.id,
              name: product.name,
              description: product.description || '',
              price: product.price || 0,
              image: product.image || ''
            });
            
            // Importamos los modificadores
            if (product.modifiers && Array.isArray(product.modifiers)) {
              product.modifiers.forEach(modifier => {
                const modifierData = {
                  id: modifier.id || Date.now(),
                  productId: product.id,
                  name: modifier.name,
                  min: modifier.min || 0,
                  max: modifier.max || 1,
                  type: modifier.type || 1,
                  position: modifier.position || 1,
                  options: []
                };
                
                // Importamos las opciones
                if (modifier.options && Array.isArray(modifier.options)) {
                  modifierData.options = modifier.options.map(option => ({
                    id: option.id || Date.now(),
                    label: option.label,
                    value: option.value || 0
                  }));
                }
                
                this.modifiers.push(modifierData);
              });
            }
          });
        }
      });
      
      // Actualizamos las tablas
      this.updateCategoriesTable();
      this.updateProductsTable();
      this.updateModifiersTable();
      this.updatePreview();
      this.updateJSONOutput();
      
      // Guardamos los datos importados
      this.saveToLocalStorage();
      
      // Limpiamos el campo de importación
      jsonInput.value = '';
      
      this.showToast('Datos importados exitosamente');
    } catch (error) {
      console.error('Error al importar JSON:', error);
      this.showToast('Error al importar: JSON inválido', 'error');
    }
  }
}

// Exportar una instancia global para uso en onclick handlers
if (typeof window !== 'undefined') {
  window.menuBuilder = new MenuBuilder();
}
