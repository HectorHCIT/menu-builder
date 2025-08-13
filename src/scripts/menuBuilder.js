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
  
  /**
   * Alias para showStep para mayor claridad semántica
   */
  goToStep(stepNumber) {
    this.showStep(stepNumber);
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
            <div class="flex space-x-3">
              <button onclick="menuBuilder.editCategory(${category.id})" class="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.1l-2.12.636.636-2.12L19.414 5.414z" />
                </svg>
                Editar
              </button>
              <button onclick="menuBuilder.deleteCategory(${category.id})" class="text-red-600 hover:text-red-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            </div>
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
  
  /**
   * Edita una categoría
   */
  editCategory(id) {
    const category = this.categories.find(cat => cat.id === id);
    if (!category) return;
    
    // Rellenar el formulario con los datos actuales
    const categoryNameInput = document.getElementById('category-name');
    const addCategoryBtn = document.getElementById('add-category-btn');
    
    if (!categoryNameInput || !addCategoryBtn) return;
    
    // Cambiar el formulario a modo edición
    categoryNameInput.value = category.name;
    const originalBtnText = addCategoryBtn.textContent;
    addCategoryBtn.textContent = 'Actualizar Categoría';
    addCategoryBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    addCategoryBtn.classList.remove('bg-primary', 'hover:bg-red-600');
    
    // Scroll al formulario
    categoryNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    categoryNameInput.focus();
    
    // Guardar la función original del botón
    const originalOnClick = addCategoryBtn.onclick;
    
    // Cambiar la función del botón para actualizar en lugar de agregar
    addCategoryBtn.onclick = () => {
      const newName = categoryNameInput.value.trim();
      
      if (newName === '') {
        this.showToast('El nombre de la categoría no puede estar vacío', 'error');
        return;
      }
      
      // Verificamos si ya existe otra categoría con ese nombre
      if (this.categories.some(cat => cat.id !== id && cat.name.toLowerCase() === newName.toLowerCase())) {
        this.showToast('Ya existe una categoría con ese nombre', 'error');
        return;
      }
      
      // Actualizamos el nombre
      category.name = newName;
      
      // Actualizamos la tabla y guardamos
      this.updateCategoriesTable();
      this.updateCategoryOptions();
      this.saveToLocalStorage();
      this.showToast('Categoría actualizada exitosamente');
      
      // Restaurar el formulario a su estado original
      categoryNameInput.value = '';
      addCategoryBtn.textContent = originalBtnText;
      addCategoryBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      addCategoryBtn.classList.add('bg-primary', 'hover:bg-red-600');
      
      // Restaurar la función original del botón
      addCategoryBtn.onclick = originalOnClick;
      
      // Eliminar el botón de cancelar si existe
      if (document.getElementById('cancel-edit-btn')) {
        document.getElementById('cancel-edit-btn').remove();
      }
    };
    
    // Agregar un botón de cancelar si no existe
    if (!document.getElementById('cancel-edit-btn')) {
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancel-edit-btn';
      cancelBtn.className = 'px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium ml-4';
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.onclick = () => {
        // Restaurar el formulario a su estado original
        categoryNameInput.value = '';
        addCategoryBtn.textContent = originalBtnText;
        addCategoryBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        addCategoryBtn.classList.add('bg-primary', 'hover:bg-red-600');
        
        // Restaurar la función original del botón
        addCategoryBtn.onclick = originalOnClick;
        
        // Eliminar el botón de cancelar
        cancelBtn.remove();
      };
      
      // Agregar el botón de cancelar junto al botón de actualizar
      addCategoryBtn.parentNode.appendChild(cancelBtn);
    }
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
            <div class="flex space-x-3">
              <button onclick="menuBuilder.editProduct(${product.id})" class="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.1l-2.12.636.636-2.12L19.414 5.414z" />
                </svg>
                Editar
              </button>
              <button onclick="menuBuilder.deleteProduct(${product.id})" class="text-red-600 hover:text-red-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            </div>
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

  /**
   * Edita un producto existente
   * @param {number} id - ID del producto a editar
   */
  editProduct(id) {
    const product = this.products.find(p => p.id === id);
    if (!product) return;
    
    // Obtener referencias a los elementos del formulario
    const categorySelect = document.getElementById('product-category');
    const nameInput = document.getElementById('product-name');
    const descInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const imageInput = document.getElementById('product-image');
    const addButton = document.getElementById('add-product-btn');
    
    if (!categorySelect || !nameInput || !descInput || !priceInput || !imageInput || !addButton) return;
    
    // Cambiar a Step 2 (productos)
    this.goToStep(2);
    
    // Rellenar el formulario con los datos actuales
    categorySelect.value = product.categoryId;
    nameInput.value = product.name;
    descInput.value = product.description;
    priceInput.value = product.price;
    imageInput.value = product.image || '';
    
    // Cambiar el texto del botón y su estilo
    const originalBtnText = addButton.textContent;
    addButton.textContent = 'Actualizar Producto';
    addButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
    addButton.classList.remove('bg-primary', 'hover:bg-red-600');
    
    // Hacer scroll al formulario
    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameInput.focus();
    
    // Guardar la función original del botón
    const originalOnClick = addButton.onclick;
    
    // Cambiar la función del botón para actualizar en lugar de agregar
    addButton.onclick = () => {
      // Validar los datos
      const categoryId = parseInt(categorySelect.value);
      const name = nameInput.value.trim();
      const description = descInput.value.trim();
      const price = parseFloat(priceInput.value);
      const image = imageInput.value.trim() || null;
      
      if (!categoryId) {
        this.showToast('Por favor selecciona una categoría', 'error');
        return;
      }
      
      if (!name) {
        this.showToast('El nombre del producto no puede estar vacío', 'error');
        return;
      }
      
      if (!description) {
        this.showToast('La descripción del producto no puede estar vacía', 'error');
        return;
      }
      
      if (isNaN(price) || price <= 0) {
        this.showToast('Por favor ingresa un precio válido mayor a cero', 'error');
        return;
      }
      
      // Verificar duplicados (en la misma categoría)
      const duplicateProduct = this.products.find(p => 
        p.id !== id && 
        p.name.toLowerCase() === name.toLowerCase() && 
        p.categoryId === categoryId
      );
      
      if (duplicateProduct) {
        this.showToast(`Ya existe un producto llamado "${name}" en esta categoría`, 'error');
        return;
      }
      
      // Actualizar el producto
      product.categoryId = categoryId;
      product.name = name;
      product.description = description;
      product.price = price;
      product.image = image;
      
      // Actualizar la interfaz
      this.updateProductsTable();
      this.updateModifierProductDropdown();
      this.renderPreview();
      this.saveToLocalStorage();
      this.showToast('Producto actualizado correctamente');
      
      // Restaurar el formulario a su estado original
      categorySelect.value = '';
      nameInput.value = '';
      descInput.value = '';
      priceInput.value = '';
      imageInput.value = '';
      addButton.textContent = originalBtnText;
      addButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      addButton.classList.add('bg-primary', 'hover:bg-red-600');
      
      // Restaurar la función original del botón
      addButton.onclick = originalOnClick;
      
      // Eliminar el botón de cancelar si existe
      if (document.getElementById('cancel-edit-product-btn')) {
        document.getElementById('cancel-edit-product-btn').remove();
      }
    };
    
    // Agregar un botón de cancelar si no existe
    if (!document.getElementById('cancel-edit-product-btn')) {
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancel-edit-product-btn';
      cancelBtn.className = 'w-full px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium mt-4';
      cancelBtn.textContent = 'Cancelar Edición';
      cancelBtn.onclick = () => {
        // Restaurar el formulario a su estado original
        categorySelect.value = '';
        nameInput.value = '';
        descInput.value = '';
        priceInput.value = '';
        imageInput.value = '';
        addButton.textContent = originalBtnText;
        addButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        addButton.classList.add('bg-primary', 'hover:bg-red-600');
        
        // Restaurar la función original del botón
        addButton.onclick = originalOnClick;
        
        // Eliminar el botón de cancelar
        cancelBtn.remove();
      };
      
      // Agregar el botón de cancelar debajo del botón de actualizar
      addButton.parentNode.appendChild(cancelBtn);
    }
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
            <div class="flex space-x-3">
              <button onclick="menuBuilder.editModifier(${modifier.id})" class="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.1l-2.12.636.636-2.12L19.414 5.414z" />
                </svg>
                Editar
              </button>
              <button onclick="menuBuilder.deleteModifier(${modifier.id})" class="text-red-600 hover:text-red-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            </div>
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

  /**
   * Edita un modificador existente
   * @param {number} id - ID del modificador a editar
   */
  editModifier(id) {
    const modifier = this.modifiers.find(m => m.id === id);
    if (!modifier) return;
    
    // Obtener referencias a los elementos del formulario
    const productSelect = document.getElementById('modifier-product');
    const nameInput = document.getElementById('modifier-name');
    const minInput = document.getElementById('modifier-min');
    const maxInput = document.getElementById('modifier-max');
    const typeInputs = document.querySelectorAll('input[name="modifier-type"]');
    const positionInput = document.getElementById('modifier-position');
    const addButton = document.getElementById('save-modifier-btn');
    
    if (!productSelect || !nameInput || !minInput || !maxInput || !typeInputs.length || !positionInput || !addButton) return;
    
    // Cambiar a Step 3 (modificadores)
    this.goToStep(3);
    
    // Rellenar el formulario con los datos actuales
    productSelect.value = modifier.productId;
    nameInput.value = modifier.name;
    minInput.value = modifier.min;
    maxInput.value = modifier.max;
    positionInput.value = modifier.position;
    
    // Seleccionar el tipo correcto (único o múltiple)
    typeInputs.forEach(input => {
      if (parseInt(input.value) === modifier.type) {
        input.checked = true;
      }
    });
    
    // Cargar las opciones actuales en this.currentOptions
    this.currentOptions = [...modifier.options];
    this.updateOptionsList();
    
    // Cambiar el texto del botón y su estilo
    const originalBtnText = addButton.textContent;
    addButton.textContent = 'Actualizar Modificador';
    addButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
    addButton.classList.remove('bg-primary', 'hover:bg-red-600');
    
    // Hacer scroll al formulario
    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameInput.focus();
    
    // Guardar la función original del botón
    const originalOnClick = addButton.onclick;
    
    // Cambiar la función del botón para actualizar en lugar de agregar
    addButton.onclick = () => {
      // Validar los datos
      const productId = parseInt(productSelect.value);
      const name = nameInput.value.trim();
      const min = parseInt(minInput.value);
      const max = parseInt(maxInput.value);
      const type = parseInt(document.querySelector('input[name="modifier-type"]:checked')?.value);
      const position = parseInt(positionInput.value);
      
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
      
      // Actualizar el modificador
      modifier.productId = productId;
      modifier.name = name;
      modifier.min = min;
      modifier.max = max;
      modifier.type = type;
      modifier.position = position;
      modifier.options = [...this.currentOptions];
      
      // Actualizar la interfaz
      this.updateModifiersTable();
      this.renderPreview();
      this.saveToLocalStorage();
      this.showToast('Modificador actualizado correctamente');
      
      // Restaurar el formulario a su estado original
      productSelect.value = '';
      nameInput.value = '';
      minInput.value = 0;
      maxInput.value = 1;
      positionInput.value = 0;
      typeInputs[0].checked = true; // Seleccionar tipo único por defecto
      
      // Limpiar las opciones actuales
      this.currentOptions = [];
      this.updateOptionsList();
      
      addButton.textContent = originalBtnText;
      addButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      addButton.classList.add('bg-primary', 'hover:bg-red-600');
      
      // Restaurar la función original del botón
      addButton.onclick = originalOnClick;
      
      // Eliminar el botón de cancelar si existe
      if (document.getElementById('cancel-edit-modifier-btn')) {
        document.getElementById('cancel-edit-modifier-btn').remove();
      }
    };
    
    // Agregar un botón de cancelar si no existe
    if (!document.getElementById('cancel-edit-modifier-btn')) {
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancel-edit-modifier-btn';
      cancelBtn.className = 'w-full px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium mt-4';
      cancelBtn.textContent = 'Cancelar Edición';
      cancelBtn.onclick = () => {
        // Restaurar el formulario a su estado original
        productSelect.value = '';
        nameInput.value = '';
        minInput.value = 0;
        maxInput.value = 1;
        positionInput.value = 0;
        typeInputs[0].checked = true; // Seleccionar tipo único por defecto
        
        // Limpiar las opciones actuales
        this.currentOptions = [];
        this.updateOptionsList();
        
        addButton.textContent = originalBtnText;
        addButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        addButton.classList.add('bg-primary', 'hover:bg-red-600');
        
        // Restaurar la función original del botón
        addButton.onclick = originalOnClick;
        
        // Eliminar el botón de cancelar
        cancelBtn.remove();
      };
      
      // Agregar el botón de cancelar debajo del botón de actualizar
      addButton.parentNode.appendChild(cancelBtn);
    }
  }

  // ========== PREVIEW FUNCTIONS ==========

  /**
   * Actualiza la vista previa
   */
  /**
   * Actualiza la vista previa
   */
  updatePreview() {
    const container = document.getElementById('preview-content');
    const categoriesNav = document.getElementById('categories-nav');
    
    if (!container || !categoriesNav) return;
    
    if (this.categories.length === 0) {
      categoriesNav.innerHTML = '';
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay datos para mostrar</p>';
      return;
    }
    
    // Preparar datos agrupados por categoría
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
      categoriesNav.innerHTML = '';
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay productos para mostrar</p>';
      return;
    }
    
    // Crear la botonera de categorías
    const categoriesButtons = groupedData.map((group, index) => 
      `<button 
        id="btn-category-${group.category.id}" 
        onclick="menuBuilder.showCategory('${group.category.id}')" 
        class="category-btn px-4 py-2 rounded-md font-medium whitespace-nowrap ${index === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        data-category-id="${group.category.id}">
        ${group.category.name} (${group.products.length})
      </button>`
    ).join('');
    
    categoriesNav.innerHTML = `<div class="flex space-x-2">${categoriesButtons}</div>`;
    
    // Generar los contenedores de productos para cada categoría
    const productsContainers = groupedData.map(group => 
      `<div 
        id="category-content-${group.category.id}" 
        class="category-content ${group.category.id !== groupedData[0].category.id ? 'hidden' : ''}"
      >
        <h3 class="text-xl font-semibold text-gray-800 mb-4">${group.category.name}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${group.products.map(product => `
            <div class="bg-white rounded-lg shadow-sm overflow-hidden flex border border-gray-100">
              ${product.image ? 
                `<div class="w-1/3 max-w-[120px]">
                  <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
                </div>` : ''
              }
              <div class="p-4 flex-1">
                <h4 class="font-semibold text-gray-800 text-lg">${product.name}</h4>
                <p class="text-gray-600 text-sm my-1">${product.description}</p>
                <p class="font-semibold text-primary text-base">L. ${product.price.toFixed(2)}</p>
                
                ${product.modifiers.length > 0 ? `
                  <div class="mt-2 pt-2 border-t border-gray-100">
                    <div class="flex flex-wrap gap-1">
                      ${product.modifiers.map(modifier => 
                        `<span class="inline-block bg-gray-100 text-xs px-2 py-1 rounded-full text-gray-700">
                          ${modifier.name}
                        </span>`
                      ).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`
    ).join('');
    
    container.innerHTML = productsContainers;
  }
  
  /**
   * Muestra los productos de una categoría específica
   */
  showCategory(categoryId) {
    // Ocultar todos los contenidos de categorías
    document.querySelectorAll('.category-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    // Restablecer estilos de todos los botones
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.className = 'category-btn px-4 py-2 rounded-md font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200';
    });
    
    // Mostrar el contenido de la categoría seleccionada
    const selectedContent = document.getElementById(`category-content-${categoryId}`);
    if (selectedContent) {
      selectedContent.classList.remove('hidden');
    }
    
    // Resaltar el botón seleccionado
    const selectedBtn = document.getElementById(`btn-category-${categoryId}`);
    if (selectedBtn) {
      selectedBtn.className = 'category-btn px-4 py-2 rounded-md font-medium whitespace-nowrap bg-primary text-white';
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
