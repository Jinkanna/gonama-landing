"use strict";
import PhotoSwipeLightbox from "./photoswipe-lightbox.min.js";
import PhotoSwipe from "./photoswipe.min.js";
import PhotoSwipeVideoPlugin from "./photoswipe-video.js"
import PhotoSwipeDynamicCaption from "./photoswipe-dynamic-caption.min.js"

var BlsWishlistHeader = (function () {
  return {
    init: function () {
      this.handleCount();
    },
    handleCount: function () {
      const wishlist = document.querySelectorAll(".bls-header-wishlist");
      const items = JSON.parse(localStorage.getItem('bls__wishlist-items'));
      wishlist.forEach((item) => {
        const numb = item.querySelector(".wishlist-count");
        numb.innerText = items !== null && items.length != 0 ? items.length : 0;
      });
    },
  };
})();

var BlsWishlistLoad = (function () {
  return {
    init: function (productHandle, wishlist_items) {
      const is_page_wishlist = document.querySelector(
        ".bls__wishlist-page-section"
      );
      if (productHandle) {
        const arr_items = [];
        if (wishlist_items === null) {
          arr_items.push(productHandle);
          localStorage.setItem(
            "bls__wishlist-items",
            JSON.stringify(arr_items)
          );
        } else {
          let index = wishlist_items.indexOf(productHandle);
          arr_items.push(...wishlist_items);
          if (index === -1) {
            arr_items.push(productHandle);
            localStorage.setItem(
              "bls__wishlist-items",
              JSON.stringify(arr_items)
            );
          } else if (index > -1) {
            arr_items.splice(index, 1);
            localStorage.setItem(
              "bls__wishlist-items",
              JSON.stringify(arr_items)
            );
            if (is_page_wishlist) {
              const div_no_product = is_page_wishlist.querySelector(
                ".bls__wishlist-no-product-js"
              );
              const item_remove = document.querySelector(
                '.bls__wishlist-list[data-product-handle="' +
                  productHandle +
                  '"]'
              );
              if (item_remove) {
                item_remove.remove();
              }
              const it =
                is_page_wishlist.querySelectorAll(".bls__product-item");
              if (wishlist_items.length <= 1 || it.length < 1) {
                div_no_product.classList.remove("d-none");
              }
            }
          }
        }
        BlsSubActionProduct.handleInitWishlist();
      }
    },
  };
})();

var BlsSubActionProduct = (function () {
  return {
    init: function () {
      this.handleInitWishlist();
    },

    handleInitWishlist: function () {
      const wishlist_items = JSON.parse(
        localStorage.getItem("bls__wishlist-items")
      );
      const wishlist_icon = document.querySelectorAll(".bls__product-wishlist");
      wishlist_icon.forEach((e) => {
        const { proAddWishlist, proRemoveWishlist, removeWishlist, action } = e?.dataset;
        const is_page_wishlist = document.querySelector(
          ".bls__wishlist-page-section"
        );
        const tooltip_wishlist = e.querySelector(".bls_tooltip-content");
        const productHandle = e.dataset.productHandle;
        if (wishlist_items !== null) {
          let index = wishlist_items.indexOf(productHandle);
          if (index !== -1) {
            e.querySelector(".bls__product-icon").classList.add("active");
            if (is_page_wishlist) {
              tooltip_wishlist.innerText =
                window.stringsTemplate?.messageRemoveWishlist;
            } else {
              if (action === 'remove') {
                tooltip_wishlist.innerText = removeWishlist;
              }else {
                tooltip_wishlist.innerText = proRemoveWishlist;
              }
            }
          } else {
            e.querySelector(".bls__product-icon").classList.remove("active");
            tooltip_wishlist.innerText = proAddWishlist;
          }
        }
        BlsWishlistHeader.init();
      });
    }
  };
})();
BlsSubActionProduct.init();

class ShopableWishlist extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init(){
    const btnWishlist = this.querySelector(
      ".bls__product-wishlist-js"
    );
    btnWishlist.addEventListener("click", this.handleWishlistFunctionClick);
  }

  handleWishlistFunctionClick(evt)  {
    evt.preventDefault();
    const e = evt.currentTarget;
    const wishlist_items = JSON.parse(
      localStorage.getItem("bls__wishlist-items")
    );
    const productHandle = e.dataset.productHandle;
    const action = e.dataset.action;
    const is_page_wishlist = document.querySelector(
      ".bls__wishlist-page-section"
    );
    if (is_page_wishlist) {
      BlsWishlistLoad.init(productHandle, wishlist_items);
    }
    const arr_items = [];
    if (wishlist_items === null) {
      arr_items.push(productHandle);
      localStorage.setItem("bls__wishlist-items", JSON.stringify(arr_items));
      BlsSubActionProduct.handleInitWishlist();
    } else {
      let index = wishlist_items.indexOf(productHandle);
      arr_items.push(...wishlist_items);
      if (index === -1) {
        arr_items.push(productHandle);
        localStorage.setItem(
          "bls__wishlist-items",
          JSON.stringify(arr_items)
        );
        BlsSubActionProduct.handleInitWishlist();
      } else if (index > -1) {
        if (is_page_wishlist) {
          arr_items.splice(index, 1);
          localStorage.setItem(
            "bls__wishlist-items",
            JSON.stringify(arr_items)
          );
        } else {
          if (action === 'remove') {
            BlsWishlistLoad.init(productHandle, wishlist_items);
          }else{
            window.location.href = `${window.shopUrl}${window.Shopify.routes.root}pages/wishlist`;
          }
        }
      }
    }
  }
}
customElements.define('shopable-wishlist', ShopableWishlist);

class ButtonShowProduct extends HTMLElement{
  constructor(){
    super();
    this.init();
  }

  init(){
    const actions = this.querySelector('.shopable-action');
    actions.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const parent = target.closest('.pswp__dynamic-caption');
      parent.querySelector('.bls__product-shopable-video-item').classList.add('active');
    })
  }
}
customElements.define('button-show-product', ButtonShowProduct)
class ShopableVideo extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    const items = Array.from(document.getElementsByClassName('bls__section_shopable-inner'));
    if (items.length === 0) return;
    this.openGallery();
  }

  generateUniqueId() {
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timestampPart = Date.now().toString(36).substring(2, 12);
    
    return randomPart + timestampPart;
  }

  replaceFunction(contentHtml){
    const variantSectionId = contentHtml.querySelector('variant-radios-product-shopable-video');
    const dataSectionId = variantSectionId?.dataset.section;
    const uuidGenerate = this.generateUniqueId();
    const idReplace = dataSectionId?.replace(dataSectionId,uuidGenerate)
    if (idReplace) {
      contentHtml.querySelector('form').setAttribute('id', `product-form-${idReplace}`)
      variantSectionId.setAttribute('data-section',idReplace)
    }
  }

  openGallery() {
    const options = {
      counter: false,
      zoom: false,
      preloader: false,
      loop: true,
      autoplay: true,
      close: false,
      mainClass: 'pswp--shopable-video',
      arrowPrevSVG: '<i class="icon-chevron-left"></i>',
      arrowNextSVG: '<i class="icon-chevron-right"></i>',
      gallery: '#shopable-video-popup',
      children: '.bls__section_shopable-inner',
      pswpModule: PhotoSwipe,
      bgOpacity: 0.5,
    }
    const lightbox = new PhotoSwipeLightbox(options);
    lightbox.on("uiRegister", function () {
      lightbox.pswp.ui.registerElement({
        name: "bls--close",
        isButton: true,
        tagName: "button",
        html: '<i class="icon-x"></i>',
        onClick: () => {
          const pswp = lightbox.pswp;
          pswp.close();
        },
      });
    });
    lightbox.on('bindEvents', (e) => {
      const pswp = lightbox.pswp;
      pswp.bg.addEventListener('click', () => {
        pswp.close();
      })
    });
    lightbox.on('close', (e) => {
      const pswp = lightbox.pswp;
      if (document.querySelector('.bls__product-shopable-video-item') && document.querySelector('.bls__product-shopable-video-item').classList.contains('active')) {
        document.querySelector('.bls__product-shopable-video-item').classList.remove('active')
      }
    });
    lightbox.on('afterInit', (e) => {
      const { pswp } = lightbox;      
      const contentHtml = pswp.currSlide.dynamicCaption.element;
      if (contentHtml) {
        this.replaceFunction(contentHtml)
      }
    });
    lightbox.addFilter('placeholderSrc', (placeholderSrc, content) => {
      const { pswp } =lightbox
      const contentHtml = pswp.currSlide.dynamicCaption.element;
      let dataMsrc;
      if (contentHtml) {
        dataMsrc = contentHtml.querySelector('.shopable-popup-action').dataset.msrc
      }
      return dataMsrc;
    });
    const captionPlugin = new PhotoSwipeDynamicCaption(lightbox, {
      type: 'auto',
    });
    const videoPlugin = new PhotoSwipeVideoPlugin(lightbox, {});
    lightbox.on('change', () => {
      const { pswp } = lightbox;      
      const contentHtml = pswp.currSlide.dynamicCaption.element;
        if (contentHtml) {
          this.replaceFunction(contentHtml)
        }
    });
    lightbox.on('pointerDown', (e) => {
      if (e.originalEvent.target.className === 'swiper-slide')
        e.stopPropagation();
        e.preventDefault();
    });
    lightbox.init();
  }

}
customElements.define('shopable-video', ShopableVideo);

class VariantRadiosProductShopableVideo extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('.bls__option-swatch').forEach(
      (button) => button.addEventListener('click', this.onVariantChange.bind(this), false)
    );
    this.actionDropdownSwatches();
  }

  onVariantChange(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const value = target.getAttribute('data-value');
    for (var item of target.closest('fieldset').querySelectorAll('.bls__option-swatch')) {
      item.classList.remove('active');
    }
    target.classList.toggle('active');
    target.closest('fieldset').querySelector('.swatch-selected-value').textContent = value;
    this.options = Array.from(this.querySelectorAll('.bls__option-swatch.active'), (select) => select.getAttribute('data-value'));
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updateVariantStatuses();
    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  renderProductInfo() {
    if (!this.currentVariant) return;
    let qty = 0;
    let percent = 0;
    let sale = false;
    let sold_out = false;
    let pre_order = false;
    let availability = window.variantStrings.inStock;
    let variantStrings = window.variantStrings.soldOut;
    const compare_at_price = this.currentVariant.compare_at_price;
    const price = this.currentVariant.price;
    const form = document.getElementById(`product-form-${this.dataset.section}`);
    const product = form.closest('.bls__product-shopable-video-item-popup');
    this.getVariantQtyData().find((variantQty) => {
      if (variantQty.id === this.currentVariant.id) {
        qty = variantQty.qty;
      }
    });
    if (compare_at_price && compare_at_price > price) {
      sale = true;
      percent = (compare_at_price - price) / compare_at_price * 100;
    }
    if (this.currentVariant.available && qty < 1) {
      availability = window.variantStrings.preOrder;
      variantStrings = window.variantStrings.preOrder;
    } else if (!this.currentVariant.available) {
      availability = window.variantStrings.outStock;
    } else {
      availability = window.variantStrings.inStock;
      variantStrings = window.variantStrings.addToCart;
    }
    if (this.currentVariant.available && qty < 1) {
      pre_order = true;
    } else if (!this.currentVariant.available) {
      sold_out = true
    }
    if (this.currentVariant.inventory_management === null) {
      sold_out = false;
      pre_order = false;
      availability = window.variantStrings.inStock;
      variantStrings = window.variantStrings.addToCart;
    }
    const product_label = product.querySelector('.bls__product-label');
    if (product_label) {
      product_label.remove();
    }
    if (sale || pre_order || sold_out) {
      var element = document.createElement('div');
      element.classList.add('bls__product-label', 'fs-12', 'pointer-events-none', 'd-inline-block');
      product.querySelector('.bls__product-details').insertBefore(element, product.querySelector('.bls__product-details').children[0]);
      const label = product.querySelector('.bls__product-label');
      if (sold_out) {
        var element_sold_out = document.createElement('div');
        element_sold_out.classList.add('bls__sold-out-label');
        element_sold_out.innerText = window.variantStrings.soldOut;
        label.appendChild(element_sold_out);
      } else {
        if (sale && sold_out == false) {
          var element_sale = document.createElement('div');
          element_sale.classList.add('bls__sale-label');
          element_sale.innerText = -percent.toFixed(0) + '%';
          label.appendChild(element_sale);
        }
        if (pre_order) {
          var element_pre_order = document.createElement('div');
          element_pre_order.classList.add('bls__pre-order-label');
          element_pre_order.innerText = window.variantStrings.preOrder;
          label.appendChild(element_pre_order);
        }
      }
    }
    const stockstockNotify = product.querySelectorAll('.product-notify-stock');
    if (stockstockNotify.length) {
      stockstockNotify.forEach(stock => {
        if (!this.currentVariant.available) {
          stock.style.display = 'block';
          stock.setAttribute('data-product-variant', this.currentVariant.id)
        } else {
          stock.style.display = 'none';
          stock.setAttribute('data-product-variant', this.currentVariant.id)
        }
      })
    }

    const price_format = Shopify.formatMoney(this.currentVariant.price, cartStrings.money_format);
    product.querySelector('.price__regular .price').innerHTML = price_format;
    console.log(product.querySelector('.price__regular .price'));
    const bls__price = product.querySelector('.bls__price');
    bls__price.classList.remove('price--sold-out', 'price--on-sale');
    bls__price.querySelector('.price__regular .price').classList.remove('special-price');
    if (compare_at_price && compare_at_price > price) {
      const compare_format = Shopify.formatMoney(compare_at_price, cartStrings.money_format)
      if (bls__price.querySelector('.compare-price')) {
        bls__price.querySelector('.compare-price').innerHTML = compare_format;
      }
      bls__price.classList.add('price--on-sale');
      bls__price.querySelector('.price__regular .price').classList.add('special-price');
    } else if (!this.currentVariant.available) {
      bls__price.classList.add('price--sold-out');
    }
    this.toggleAddButton(!this.currentVariant.available, variantStrings);
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    const buttonPayment = productForm.querySelector('.bls__product-dynamic-checkout');
    if (!addButton) return;
    if (disable) {
      if (buttonPayment) {
        buttonPayment.style.display = 'none';
      }
      addButton.setAttribute('disabled', 'disabled');
    } else {
      if (buttonPayment) {
        buttonPayment.style.display = 'block';
      }
      addButton.removeAttribute('disabled');
    }
    if (text) addButtonText.textContent = text;

    if (!modifyClass) return;
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.getVariantData().filter(
      (variant) => this.querySelector('.active').dataset.value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('.bls__option-swatch')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector('.active').dataset.value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setAvailability(optionInputs, availableOptionInputsValue);
    });
  }
  setAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.dataset.value)) {
        input.removeAttribute('data-disabled');
      } else {
        input.setAttribute('data-disabled', 'disable');
      }
    });
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  getVariantQtyData() {
    this.variantQtyData = JSON.parse(this.querySelector('.productVariantsQty').textContent);
    return this.variantQtyData;
  }

  eventProductGroupAction() {
    document.querySelectorAll('#bls__product-group .product-variant-option').forEach(select => {
      select.addEventListener("change", (event) => {
        var target = event.target;
        var
          image = target.options[target.selectedIndex].getAttribute('data-image'),
          pro_handle = target.getAttribute('data-handle')
        var img = target.closest('#bls__product-group').querySelector('.product-group-image-item.' + pro_handle + '').querySelector('img');
        if (img) {
          img.removeAttribute('srcset');
          img.setAttribute('src', image);
        }
      }, false);
    });

    document.querySelectorAll('.product-group-submit').forEach(
      (button) => {
        button.addEventListener('click', this.submitProductGroup.bind(this), false)
      }
    );
  }

  submitProductGroup(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    const form = document.getElementById('bls__product-group-form');
    const config = fetchConfig('json');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (cart) {
      formData.append('sections', cart.getSectionsToRender().map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
    }
    config.body = formData;
    target.classList.add('btn-loading');
    fetch(`${routes.cart_add_url}.js`, config)
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        fetch('/cart.json')
          .then(res => res.json())
          .then(cart => {
            document.querySelectorAll(".cart-count").forEach(el => {
              if (el.classList.contains('cart-count-drawer')) {
                el.innerHTML = `(${cart.item_count})`;
              } else {
                el.innerHTML = cart.item_count;
              }
            });
            const cart_free_ship = document.querySelector("free-ship-progress-bar");
            if (cart_free_ship) {
              cart_free_ship.init(cart.items_subtotal_price);
            }
          })
          .catch((error) => {
            throw error;
          });
        const parsedState = JSON.parse(state);
        cart.getSectionsToRender().forEach((section => {
          const elementToReplace = document.getElementById(section.id);
          const html = new DOMParser().parseFromString(parsedState.sections[section.id], 'text/html');
          elementToReplace.innerHTML = html.querySelector('#form-mini-cart').innerHTML;
          const countdown = cart.querySelector('.cart-countdown-time');
          const html_countdown = html.querySelector('.cart-countdown-time');
          if (countdown && html_countdown) {
            countdown.innerHTML = html_countdown.innerHTML;
            cart.countdownTimer();
          }
        }));
        cart.cartAction();
      })
      .catch((e) => {
        throw e;
      })
      .finally(() => {
        target.classList.remove('btn-loading');
        cart.open();
        BlsLazyloadImg.init();
      });
  }

  actionDropdownSwatches() {
    this.querySelectorAll('[data-swatches-value]').forEach((items) => {
      items.addEventListener('click', (e) => {
        const target = e.currentTarget;
        if (!target.closest(".bls__color-dropdown").classList.contains("isClicked")) {
          for (var item of document.querySelectorAll('.bls__color-dropdown')) {
            item.classList.remove('isClicked');
          }
          target.closest(".bls__color-dropdown").classList.add("isClicked");
        } else {
          target.closest(".bls__color-dropdown").classList.remove("isClicked");
        }
      }, false);
    });
    this.querySelectorAll('.bls__product-color-swatches-dropdown').forEach((swatches) => {
      swatches.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const valueSwatch = target.dataset.value;
        const container = target.closest('.bls__color-dropdown');
        container.querySelector('.bls__color-dropdown-action .bls__color-dropdown-value').innerHTML = valueSwatch;
        target.closest('.bls__color-dropdown').classList.remove('isClicked')
      })
    })
  }
}
customElements.define('variant-radios-product-shopable-video', VariantRadiosProductShopableVideo);