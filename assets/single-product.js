class VariantRadiosProductSingle extends HTMLElement {
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
        const product = form.closest('.bls__product-single');
        this.getVariantQtyData().find((variantQty) => {
            if (variantQty.id === this.currentVariant.id) {
                qty = variantQty.qty;
            }
        });
        if (compare_at_price && compare_at_price > price) {
            sale = true;
            percent = (compare_at_price - price)/compare_at_price*100;
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
        if (product.querySelector('.bls__availability-value')) {
            product.querySelector('.bls__availability-value').textContent = availability;
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
            element.classList.add('bls__product-label', 'fs-12', 'pointer-events-none', 'absolute');
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
                    if (window.productLabel.saleType == 'price') {
                        element_sale.innerText = "- " + Shopify.formatMoney(
                          (compare_at_price - price),
                          cartStrings.money_format
                        );
                    } else if (window.productLabel.saleType == 'text') {
                    element_sale.innerText = window.productLabel.saleLabel;
                    } else {
                    element_sale.innerText = -percent.toFixed(0) + "%";
                    }
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
        if(stockstockNotify.length){
            stockstockNotify.forEach(stock =>{
                if (!this.currentVariant.available) {
                    stock.style.display = 'block';
                    stock.setAttribute('data-product-variant',this.currentVariant.id)
                }else{
                    stock.style.display = 'none';
                    stock.setAttribute('data-product-variant',this.currentVariant.id)
                }
            })
        }

        if (this.currentVariant.featured_media) {
            setTimeout(() => {
                product.querySelector('.bls__product-main-img img').removeAttribute('srcset');
                product.querySelector('.bls__product-main-img img').setAttribute('src', this.currentVariant.featured_media.preview_image.src);
            }, 500);
        }
        if (product.querySelector('.bls__product-sku-value')) {
        product.querySelector('.bls__product-sku-value').textContent = this.currentVariant.sku && this.currentVariant.sku != "" ? this.currentVariant.sku : "N/A";
        }
        const price_format = Shopify.formatMoney(this.currentVariant.price, cartStrings.money_format);
        product.querySelector('.price__regular .price').innerHTML = price_format;
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

    updateVariantStatuses(){
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
                input.setAttribute('data-disabled','disable');
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
                var img = target.closest('#bls__product-group').querySelector('.product-group-image-item.'+pro_handle+'').querySelector('img');
                if ( img ) {
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
                                }else{
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

    actionDropdownSwatches(){
        this.querySelectorAll('[data-swatches-value]').forEach((items) => {
            items.addEventListener('click' , (e) => {
                const target = e.currentTarget;
               if (!target.closest(".bls__color-dropdown").classList.contains("isClicked")) {
                 for (var item of document.querySelectorAll('.bls__color-dropdown')){
                    item.classList.remove('isClicked');
                 }
                 target.closest(".bls__color-dropdown").classList.add("isClicked");
               }else{
                target.closest(".bls__color-dropdown").classList.remove("isClicked");
               }
             },false);
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
customElements.define('variant-radios-product-single', VariantRadiosProductSingle);

var BlsEventGroup = (function () {
    return {
        init: function() {
        this.eventProductGroup();
        this.showPopupStockNotify();
        },
        eventProductGroup: function() {
            var group = document.querySelector('.productGroup[type="application/json"]');
            if (!group) return;
            var variantData = JSON.parse(group.innerText);
            var query = '';
            variantData.forEach((e, key, variantData) => {
                if (!Object.is(variantData.length - 1, key)) {
                    query += e+'%20OR%20id:';
                }
                else{
                    query += e;
                }
            });
            var productAjaxURL = "?q=id:" + query+'&section_id=product-grouped';
            fetch(`${window.routes.search_url}${productAjaxURL}`)
            .then(response => response.text())
            .then(async (responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                document.getElementById('bls__product-group').innerHTML = html.querySelector('.bls__product-group').innerHTML;
            }).catch((e) => {
                throw error;
            }).finally(() => {
                this.eventProductGroupAction()
                BlsLazyloadImg.init();
            });
        },
        
        eventProductGroupAction: function() {
            document.querySelectorAll('#bls__product-group .product-variant-option').forEach(select => {
                select.addEventListener("change", (event) => {
                    var target = event.target;
                    var
                        image = target.options[target.selectedIndex].getAttribute('data-image'),
                        price = target.options[target.selectedIndex].getAttribute('data-price'),
                        pro_handle = target.getAttribute('data-handle'),
                        compare_price = target.options[target.selectedIndex].getAttribute('data-compare-price');
                    var img = target.closest('#bls__product-group').querySelector('.product-group-image-item.'+pro_handle+'').querySelector('img');
                    if ( img ) {
                        img.removeAttribute('srcset');
                        img.setAttribute('src', image);
                    }
                    var info_price = target.closest('.product-group-item').querySelector('.info-price');
                    info_price.querySelector('.price__regular .price').innerHTML = Shopify.formatMoney(price, cartStrings.money_format);
                    const bls__price = info_price.querySelector('.bls__price');
                    bls__price.classList.remove('price--sold-out', 'price--on-sale');
                    bls__price.querySelector('.price__regular .price').classList.remove('special-price');
                    if (compare_price && compare_price > price) {
                        const compare_format = Shopify.formatMoney(compare_price, cartStrings.money_format)
                        if (bls__price.querySelector('.compare-price')) {
                            bls__price.querySelector('.compare-price').innerHTML = compare_format;
                        }
                        bls__price.classList.add('price--on-sale');
                        bls__price.querySelector('.price__regular .price').classList.add('special-price');
                    }
                    target.setAttribute('data-price', price);
                    target.setAttribute('data-compare-price', compare_price);
                }, false);
            });

            let totalQty = 0;
            const classQty = document.querySelectorAll('.quantity__input-product-group')
            classQty.forEach(input => {
                let valueQtyDefault = input.value
                let valueAsDefault = parseFloat(valueQtyDefault);
                if (!isNaN(valueAsDefault)) {
                    totalQty += valueAsDefault
                }
                input.addEventListener('change', () => {
                    totalQty = 0;
                    classQty.forEach(value => {
                        let valueQty = value.value
                        let valueAsQty = parseFloat(valueQty);
                        if (!isNaN(valueAsQty)) {
                            totalQty += valueAsQty
                        }
                    })
                })
            });
            document.querySelectorAll('.product-group-submit').forEach(
                (button) => {
                    button.addEventListener('click', 
                        (event) => {
                            if (totalQty === 0) {
                                const content = document.querySelector(".form-infor .add-cart-error");
                                const messageErrQty = button.getAttribute('data-add-cart-err-qty');
                                if (!content) return;
                                var error_message = EasyDialogBox.create(
                                    "add_cart_error",
                                    "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                                    "",
                                    content.innerHTML = messageErrQty
                                );
                                error_message.onClose = error_message.destroy;
                                error_message.show();
                            } else {
                                this.submitProductGroup(event)
                            }
                        }
                    , false)
                }
            );

            document.querySelectorAll('.product-group-buy-now').forEach(
                (button) => {
                    button.addEventListener('click', 
                        (event) => {
                            if (totalQty === 0) {
                                const content = document.querySelector(".form-infor .add-cart-error");
                                const messageErrQty = button.getAttribute('data-add-cart-err-qty');
                                if (!content) return;
                                var error_message = EasyDialogBox.create(
                                    "add_cart_error",
                                    "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                                    "",
                                    content.innerHTML = messageErrQty
                                );
                                error_message.onClose = error_message.destroy;
                                error_message.show();
                            } else {
                                this.submitNowProductGroup(event)
                            }
                        }
                    , false)
                }
            );
        },

        submitProductGroup: function(event) {
            event.preventDefault();
            const target = event.currentTarget;
            const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
            const form = document.getElementById('form-product-grouped');
            const config = fetchConfig('json');
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
            delete config.headers['Content-Type'];
            let openMiniCart = 0
            const formData = new FormData(form);
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
                                    }else{
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
                    if (parsedState.message) {
                        const content = document.querySelector(".form-infor .add-cart-error");
                        if (!content) return;
                        var error_message = EasyDialogBox.create(
                            "add_cart_error",
                            "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                            "",
                            content.innerHTML = parsedState.description
                        );
                        error_message.onClose = error_message.destroy;
                        error_message.show();
                    } else {
                        openMiniCart = 1
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
                    }
                })
                .catch((e) => {
                    throw e;
                })
                .finally(() => {
                    target.classList.remove('btn-loading');
                    if (openMiniCart === 1) {
                        cart.open();
                    }
                    BlsLazyloadImg.init();
                });
        },

        submitNowProductGroup: function(event) {
            event.preventDefault();
            const form = document.getElementById('form-product-grouped');
            const config = fetchConfig('json');
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
            delete config.headers['Content-Type'];
            const formData = new FormData(form);
            config.body = formData;
            fetch(`${routes.cart_add_url}.js`, config)
                .then((response) => {
                    return response.text();
                })
                .then((state) => {
                    const parsedState = JSON.parse(state);
                    if (parsedState.items) {
                        window.location.href = "/checkout";
                    }else{
                        const content = document.querySelector(".form-infor .add-cart-error");
                        if (!content) return;
                        var error_message = EasyDialogBox.create(
                            "add_cart_error",
                            "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                            "",
                            content.innerHTML = parsedState.description
                        );
                        error_message.onClose = error_message.destroy;
                        error_message.show();
                    }
                })
                .catch((e) => {
                    throw e;
                })
        },

        showPopupStockNotify: function () {
            const stockClass = document.querySelectorAll(".product-notify-stock");
            const _this = this;
            stockClass.forEach(stock => {
                stock.addEventListener("click", (e) => {
                    const target = e.currentTarget;
                    const variantId = target.getAttribute('data-product-variant')
                    e.preventDefault();
                    _this.fetchDataStockNotifySection(variantId);
                    });
            })
          },

        fetchDataStockNotifySection: function(variantId) {
            const url = "/variants/"+variantId+"/?section_id=stock-notify";
            fetch(url)
                .then((response) => response.text())
                .then((responseText) => {
                    const html = newParser.parseFromString(responseText, "text/html");
                    const id = html.querySelector("#bls-stock-notify");
                    const text = id.getAttribute('data-stock-title')
                    if (id) {
                        var createPopupStock = EasyDialogBox.create('stockNotify', 'dlg dlg-disable-footer dlg-disable-drag', text, id.innerHTML);
                        createPopupStock.onClose = createPopupStock.destroy;
                        createPopupStock.show();
                    }
                })
                .catch((e) => {
                throw e;
                });
        }
    }
  })();
BlsEventGroup.init();