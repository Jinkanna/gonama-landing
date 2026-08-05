("use strict");
function fetchConfig(type = "json") {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: `application/${type}`,
      },
    };
  }

  class QuickBuy extends HTMLElement {
    constructor() {
      super();
      this.miniCart = document.querySelector("cart-notification") || document.querySelector("cart-drawer");
      this.buttonAddToCart = this.querySelector('.bls__js-addtocart');
      this.buttonAddToCart.addEventListener("click", this.actionAddToCart.bind(this))
      this.productVariantId = this.dataset.productVariantId;
    }

    updateMasterId(options, variantData) {
      var result = variantData.find((variant) => {
        return !variant.options
          .map((option, index) => {
            return options[index] === option;
          })
          .includes(false);
      });
      return result;
    }

    actionAddToCart(e) {
      e.preventDefault();
      this.buttonAddToCart.classList.add("btn-loading");
      const productTarget = this.buttonAddToCart.closest(".bls__product-item");
      const p = productTarget.querySelector(".bls__product-addtocart-js");
      const prodVariantId = p.dataset.productVariantId;
      const exist_load = this.buttonAddToCart.querySelectorAll("span.loader-icon");
      if (exist_load.length === 0) {
        const exist_loading = this.buttonAddToCart.querySelectorAll("div.loader-icon");
        if (exist_loading.length === 0) {
          const spanLoading = document.createElement("div");
          spanLoading.classList.add("loader-icon");
          this.buttonAddToCart.appendChild(spanLoading);
        }
      }
      var qty = 1;
      const sectionMiniCart = this.miniCart.getSectionsToRender().map((section) => section.id);
      if (productTarget.querySelector(".productinfo")) {
        const variantData = JSON.parse(
          productTarget.querySelector(".productinfo").textContent
        );
        let options = Array.from(
          productTarget.querySelectorAll(".bls__option-swatch-js.active"),
          (select) => select.getAttribute("data-value")
        );
        const currentVariant = this.updateMasterId(options, variantData);
        if (!currentVariant) {
          this.selectOption(productTarget, this.buttonAddToCart);
          return;
        }
      }
      this.fetchAddCart(prodVariantId, qty, sectionMiniCart, this.buttonAddToCart);
    }

    selectOption(productTarget, e) {
      const productHandle = productTarget.dataset.productHandle;
      fetch(
        `${window.Shopify.routes.root}products/${productHandle}/?section_id=product-quickview`
      )
        .then((response) => response.text())
        .then((responseText) => {
          const html = parser.parseFromString(responseText, "text/html");
          html
            .querySelectorAll("#shopify-section-product-quickview")
            .forEach((el) => {
              var quickviewBox = EasyDialogBox.create(
                "dlg-product-quickview",
                "dlg dlg-disable-heading dlg-multi dlg-disable-footer dlg-disable-drag",
                "",
                el.innerHTML
              );
              quickviewBox.onClose = quickviewBox.destroy;
              quickviewBox.show();
              BlsColorSwatchesShopify.init();
              Shopify.swiperSlideQickview();
              Shopify.eventFlashSold("dlg");
              Shopify.eventCountDownTimer("dlg");
              BlsReloadSpr.init();
              Shopify.PaymentButton.init();
              BlsLazyloadImg.init();
            });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          e.classList.remove("btn-loading");
          e.querySelectorAll(".loader-icon").forEach((el) => {
            el.remove();
          });
          Shopify.termsConditionsAction();
          BlsSubActionProduct.handleActionWishlist();
          BlsSubActionProduct.handleInitWishlist();
          BlsSubActionProduct.handleActionCompare();
          BlsSubActionProduct.handleInitCompare();
          BlsSubActionProduct.showPopupStockNotify();
        });
    }

    fetchAddCart(variantId, quantity, properties, e) {
      fetch(`${routes?.cart_add_url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: Number(variantId),
          quantity: Number(quantity),
          sections: properties,
        }),
      })
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          fetch("/cart.json")
            .then((res) => res.json())
            .then((cart) => {
              if (cart.item_count != undefined) {
                document.querySelectorAll(".cart-count").forEach((el) => {
                  if (el.classList.contains('cart-count-drawer')) {
                    el.innerHTML = `(${cart.item_count})`;
                    }else{
                    el.innerHTML = cart.item_count;
                    }
                });
                if (document.querySelector("header-total-price")) {
                  document
                    .querySelector("header-total-price")
                    .updateTotal(cart);
                }
                const cart_free_ship = document.querySelector(
                  "free-ship-progress-bar"
                );
                if (cart_free_ship) {
                  cart_free_ship.init(cart.items_subtotal_price);
                }
              }
            })
            .catch((error) => {
              throw error;
            });
          const parsedState = JSON.parse(state);
          if (!parsedState.errors) {
            this.miniCart.getSectionsToRender().forEach((section) => {
              const elementToReplace = document.getElementById(section.id);
              const html = new DOMParser().parseFromString(
                parsedState.sections[section.id],
                "text/html"
              );
              if (elementToReplace) {
                elementToReplace.innerHTML =
                html.querySelector("#form-mini-cart").innerHTML;
              }
              const countdown = this.miniCart.querySelector(".cart-countdown-time");
              const html_countdown = html.querySelector(".cart-countdown-time");
              if (countdown && html_countdown) {
                countdown.innerHTML = html_countdown.innerHTML;
                this.miniCart.countdownTimer();
              }
              const cartUpsell = this.miniCart.querySelector('.bls-recommendations-beside');
              const html_cartUpsell = html.querySelector('.bls-recommendations-beside');
              const cartUpsellMobile = this.miniCart.querySelector('.cart-recomment-beside-mobile');
              const html_cartUpselSelected = html.querySelector('.bls-recommendations-beside-selected');
              var counteSelect;
              if (cartUpsell && html_cartUpsell) {
                if (html_cartUpselSelected) {
                  counteSelect = Array.from(html_cartUpselSelected.getElementsByClassName('bls-cart-upsell-item'));
                  if (counteSelect.length == 0) {
                    cartUpsell.classList.remove('is-opend');
                    cartUpsellMobile.classList.add('d-none');
                  }
                }
                if (!counteSelect || counteSelect.length != 0) {
                  setTimeout(() => {
                    cartUpsell.classList.add("is-opend");
                  }, 1500);
                }
                cartUpsell.innerHTML = html_cartUpsell.innerHTML
              }
            });
            this.miniCart.cartAction();
            if (this.miniCart && this.miniCart.classList.contains("is-empty"))
            this.miniCart.classList.remove("is-empty");
            this.miniCart.open();
          }else{
            const content = document.querySelector(".form-infor .add-cart-error");
          if (!content) return;
          var error_message = EasyDialogBox.create(
            "add_cart_error",
            "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
            "",
            content.innerHTML
          );
          error_message.onClose = error_message.destroy;
          error_message.show();
          }

        })
        .catch((e) => {
          throw e;
        })
        .finally(() => {
          e.classList.remove("btn-loading");
          e.querySelectorAll(".loader-icon").forEach((el) => {
            el.remove();
          });
          Shopify.termsConditionsAction();
          BlsLazyloadImg.init();
          BlsSettingsSwiper.init();
        });
    }

    getSectionsToRender() {
      return [
        {
          id: "form-mini-cart",
        },
        {
          id: 'main-cart-items',
          section: document.getElementById('main-cart-items').dataset.id,
          selector: '.js-contents',
        }
      ];
    }
  }

  customElements.define("quick-buy", QuickBuy);

  if (!customElements.get("product-form")) {
    customElements.define(
      "product-form",
      class ProductForm extends HTMLElement {
        constructor() {
          super();
          this.form = this.querySelector("form");
          this.form.querySelector("[name=id]").disabled = false;
          this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
          this.cart =
            document.querySelector("cart-notification") ||
            document.querySelector("cart-drawer");
          this.submitButton = this.querySelector('[type="submit"]');
          if (document.querySelector("cart-drawer"))
            this.submitButton.setAttribute("aria-haspopup", "dialog");
          this.hideErrors = this.dataset.hideErrors === "true";
        }
  
        onSubmitHandler(evt) {
          evt.preventDefault();
  
          this.handleErrorMessage();
  
          const config = fetchConfig("json");
          config.headers["X-Requested-With"] = "XMLHttpRequest";
          delete config.headers["Content-Type"];
  
          const formData = new FormData(this.form);
          const bpdi = this.form.closest(".bls__product-details-infor");
          if (bpdi) {
            bpdi.querySelectorAll("product-property").forEach((property) => {
              const input = property.querySelector("input");
              if (input.classList.contains("file") && input.files[0]) {
                formData.append(input.name, input.files[0]);
              } else if (input.classList.contains("text") && input.value) {
                formData.append(input.name, input.value);
              }
            });
          }
          this.submitButton.setAttribute("disabled", true);
          this.submitButton.classList.add("btn-loading");
          if (this.cart) {
            formData.append(
              "sections",
              this.cart.getSectionsToRender().map((section) => section.id)
            );
            formData.append("sections_url", window.location.pathname);
            this.cart.setActiveElement(document.activeElement);
          }
          config.body = formData;
          fetch(`${routes?.cart_add_url}`, config)
            .then((response) => {
              return response.text();
            })
            .then((state) => {
              this.submitButton.setAttribute("disabled", true);
              this.submitButton.querySelector("span").classList.add("hidden");
              fetch("/cart.json")
                .then((res) => res.json())
                .then((cart) => {
                  if (cart.item_count != undefined) {
                    document.querySelectorAll(".cart-count").forEach((el) => {
                      if (el.classList.contains('cart-count-drawer')) {
                        el.innerHTML = `(${cart.item_count})`;
                        }else{
                        el.innerHTML = cart.item_count;
                        }
                    });
                    if (document.querySelector("header-total-price")) {
                      document
                        .querySelector("header-total-price")
                        .updateTotal(cart);
                    }
                    const cart_free_ship = document.querySelector(
                      "free-ship-progress-bar"
                    );
                    if (cart_free_ship) {
                      cart_free_ship.init(cart.items_subtotal_price);
                    }
                  }
                })
                .catch((error) => {
                  throw error;
                });
              const parsedState = JSON.parse(state);
              const pswp = document.querySelector('.pswp__button--bls--close');
              if (!parsedState.errors) {
                this.cart.getSectionsToRender().forEach((section) => {
                  const elementToReplace = document.getElementById(section.id);
                  const html = new DOMParser().parseFromString(
                    parsedState.sections[section.id],
                    "text/html"
                  );
                  elementToReplace.innerHTML =
                    html.querySelector("#form-mini-cart").innerHTML;
  
                  const countdown = this.cart.querySelector(
                    ".cart-countdown-time"
                  );
                  const html_countdown = html.querySelector(
                    ".cart-countdown-time"
                  );
                  if (countdown && html_countdown) {
                    countdown.innerHTML = html_countdown.innerHTML;
                    this.cart.countdownTimer();
                  }
                  const cartUpsell = this.cart.querySelector('.bls-recommendations-beside');
                  const html_cartUpsell = html.querySelector('.bls-recommendations-beside');
                  const html_cartUpselSelected = html.querySelector('.bls-recommendations-beside-selected');
                  var counteSelect;
                  if (cartUpsell && html_cartUpsell) {
                    if (html_cartUpselSelected) {
                      counteSelect = Array.from(html_cartUpselSelected.getElementsByClassName('bls-cart-upsell-item'));
                      if (counteSelect.length == 0) {
                        cartUpsell.classList.remove('is-opend')
                      }
                    }
                    if (!counteSelect || counteSelect.length != 0) {
                      setTimeout(() => {
                        cartUpsell.classList.add("is-opend");
                      }, 1500);
                    }
                    cartUpsell.innerHTML = html_cartUpsell.innerHTML
                  }
                });
                const quantity = parsedState.quantity;
                if (document.querySelector(".quantity__label") && quantity > 0) {
                  document
                    .querySelector(".quantity-cart").innerHTML = quantity;
                  document.querySelector(".quantity__label").classList.remove("hidden");
                }
                if (this.closest(".dlg")) {
                  document.querySelector(".dlg-close-x").click();
                }
                this.cart.cartAction();
                this.cart.open();
                if (pswp) {
                  pswp.click();
                }
              } else {
                const content = document.querySelector(
                  ".form-infor .add-cart-error"
                );
                const contentGiftCard = document.querySelector(
                  ".form-infor .add-gift-card-error"
                );
                const contentGiftCardDay = document.querySelector(
                  ".form-infor .add-gift-card-day-error"
                );
                if (!content || !contentGiftCard || !contentGiftCardDay) return;
                let quickview = EasyDialogBox.getById("qvdialog_0");
                let add_cart_view = EasyDialogBox.getById(
                  "dlg-product-quickview_0"
                );
                if (pswp) {
                  pswp.click();
                }
                if (quickview) {
                  quickview.onClose = quickview.destroy;
                  quickview.hide();
                }
                if (add_cart_view) {
                  add_cart_view.onClose = add_cart_view.destroy;
                }
                if (parsedState.description?.email) {
                  var error_message = EasyDialogBox.create(
                    "add_gift_card_error",
                    "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                    "",
                    contentGiftCard.innerHTML
                  );
                  error_message.onClose = error_message.destroy;
                  error_message.show();
                } else if (parsedState.description?.send_on) {
                  var error_message = EasyDialogBox.create(
                    "add_gift_card_day_error",
                    "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                    "",
                    contentGiftCardDay.innerHTML
                  );
                  error_message.onClose = error_message.destroy;
                  error_message.show();
                } else if (parsedState.errors) {
                  var error_message = EasyDialogBox.create(
                    "add_cart_error",
                    "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                    "",
                    content.innerHTML
                  );
                  error_message.onClose = error_message.destroy;
                  error_message.show();
                }
              }
            })
            .catch((e) => {
              throw e;
            })
            .finally(() => {
              this.submitButton.classList.remove("btn-loading");
              if (this.cart && this.cart.classList.contains("is-empty"))
                this.cart.classList.remove("is-empty");
              if (!this.error) this.submitButton.removeAttribute("disabled");
              this.submitButton.querySelector("span").classList.remove("hidden");
              Shopify.termsConditionsAction();
              BlsLazyloadImg.init();
              BlsSettingsSwiper.init();
            });
        }
  
        handleErrorMessage(errorMessage = false) {
          if (this.hideErrors) return;
          this.errorMessageWrapper =
            this.errorMessageWrapper ||
            this.querySelector(".product-form__error-message-wrapper");
          if (!this.errorMessageWrapper) return;
          this.errorMessage =
            this.errorMessage ||
            this.errorMessageWrapper.querySelector(
              ".product-form__error-message"
            );
  
          this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);
  
          if (errorMessage) {
            this.errorMessage.textContent = errorMessage;
          }
        }
      }
    );
  }
  
  class QuantityInput extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector("input");
      this.changeEvent = new Event("change", { bubbles: true });
      this.querySelectorAll("button").forEach((button) =>
        button.addEventListener("click", this.onButtonClick.bind(this))
      );
    }
  
    onButtonClick(event) {
      event.preventDefault();
      const previousValue = this.input.value;
      event.currentTarget.name === "plus"
        ? this.input.stepUp()
        : this.input.stepDown();
      if (previousValue !== this.input.value)
        this.input.dispatchEvent(this.changeEvent);
    }
  }
  customElements.define("quantity-input", QuantityInput);
  
  class LocalizationForm extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        input: this.querySelector(
          'input[name="language_code"], input[name="country_code"]'
        ),
        button: this.querySelector(".button-localization"),
        panel: this.querySelector("ul"),
      };
      this.elements.button.addEventListener(
        "click",
        this.openSelector.bind(this)
      );
      this.elements.button.addEventListener(
        "focusout",
        this.closeSelector.bind(this)
      );
      this.addEventListener("keyup", this.onContainerKeyUp.bind(this));
      this.querySelectorAll("a").forEach((item) =>
        item.addEventListener("click", this.onItemClick.bind(this))
      );
      this.onBodyClick = this.handleBodyClick.bind(this);
      this.initMenuMobile();
    }
  
    handleBodyClick(evt) {
      const target = evt.target;
      if (target != this && !target.closest("localization-form")) {
        this.hidePanel();
      }
    }
  
    hidePanel() {
      document.body.removeEventListener("click", this.onBodyClick);
      this.elements.button.classList.remove("opend");
      this.elements.panel.classList.add("hidden");
    }
  
    onContainerKeyUp(event) {
      if (event.code.toUpperCase() !== "ESCAPE") return;
      this.hidePanel();
      this.elements.button.focus();
    }
  
    onItemClick(event) {
      event.preventDefault();
      const form = this.querySelector("form");
      this.elements.input.value = event.currentTarget.dataset.value;
      if (form) form.submit();
    }
  
    openSelector() {
      if (this.elements.button.classList.contains("opend")) {
        this.hidePanel();
      } else {
        document.body.addEventListener("click", this.onBodyClick);
        this.elements.button.focus();
        for (var item of document.querySelectorAll(".button-localization")) {
          item.classList.remove("opend");
        }
        for (var item of document.querySelectorAll(".disclosure__list")) {
          item.classList.add("hidden");
        }
        this.elements.button.classList.add("opend");
        this.elements.panel.classList.remove("hidden");
      }
    }
  
    closeSelector(event) {
      const shouldClose =
        event.relatedTarget && event.relatedTarget.nodeName === "BUTTON";
      if (event.relatedTarget === null || shouldClose) {
        this.hidePanel();
      }
    }

    initMenuMobile(){
      let windowWidth = window.innerWidth;
      const _this = this;
      window.addEventListener("resize", function () {
         windowWidth = window.innerWidth;
        ac(windowWidth,_this);
      });
      function ac(windowWidth,_this) {
        if(windowWidth < 1024){
          const limitShow = 9;
          const lineItem = Array.from(_this.getElementsByClassName('disclosure__item-mobile'));
          if (lineItem.length === 0) return;
          if (lineItem.length > limitShow) {
            lineItem.forEach((element, index) => {
              if (index > limitShow - 1) {
                const item = lineItem[index];
                if (item.classList.contains("disclosure-menu-link")) {
                  return;
                }
                item.classList.add("disclosure-link");
                item.style.display = "none";
              }
            });
            _this.querySelector('.disclosure-menu-link').style.display = 'block';
            if (_this.querySelector('.disclosure-menu-link a')) {
              _this.querySelector('.disclosure-menu-link a').addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                const parent = target.parentElement;
                if (!parent.classList.contains("expanding")) {
                  parent.classList.add("expanding");
                  for (var item of _this.querySelectorAll(
                    ".disclosure__item-mobile.disclosure-link"
                  )) {
                    showAnime(item);
                  }
                  target.innerText = window.action.show_less
                } else {
                  parent.classList.remove("expanding");
                  for (var item of _this.querySelectorAll(
                    ".disclosure__item-mobile.disclosure-link"
                  )) {
                    hideAnime(item);
                  }
                  target.innerText = window.action.show_all
                }
              },false)
            }
          }else {
            _this.querySelector(".disclosure-menu-link").style.display = "none";
          }
        }
      }
      if(windowWidth < 1024){
        const limitShow = 9;
        const lineItem = Array.from(_this.getElementsByClassName('disclosure__item-mobile'));
        if (lineItem.length === 0) return;
        if (lineItem.length > limitShow) {
          lineItem.forEach((element, index) => {
            if (index > limitShow - 1) {
              const item = lineItem[index];
              if (item.classList.contains("disclosure-menu-link")) {
                return;
              }
              item.classList.add("disclosure-link");
              item.style.display = "none";
            }
          });
          _this.querySelector('.disclosure-menu-link').style.display = 'block';
          if (_this.querySelector('.disclosure-menu-link span')) {
            _this.querySelector('.disclosure-menu-link span').addEventListener('click', (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const parent = target.parentElement;
              if (!parent.classList.contains("expanding")) {
                parent.classList.add("expanding");
                for (var item of _this.querySelectorAll(
                  ".disclosure__item-mobile.disclosure-link"
                )) {
                  showAnime(item);
                }
                target.innerText = window.action.show_less
              } else {
                parent.classList.remove("expanding");
                for (var item of _this.querySelectorAll(
                  ".disclosure__item-mobile.disclosure-link"
                )) {
                  hideAnime(item);
                }
                target.innerText = window.action.show_all
              }
            },false)
          }
        }else {
          _this.querySelector(".disclosure-menu-link").style.display = "none";
        }
      }
      
    }
  }
  customElements.define("localization-form", LocalizationForm);
  
  class CartNotification extends HTMLElement {
    constructor() {
      super();
      this.notification = document.getElementById("bls-header_minicart");
      this.giftwrap = document.querySelector(".bls__add-giftwrap");
      this.cartCountDown = document.querySelector(".cart-countdown-time");
      this.cartUpsellBeside = document.querySelector('.bls-recommendations-beside')
      this.startTime = Date.now();
      this.querySelectorAll(".bls-minicart-wrapper .close-button").forEach(
        (closeButton) =>
          closeButton.addEventListener("click", this.close.bind(this))
      );
      document
        .querySelectorAll(".bls-minicart-action", ".close-cart")
        .forEach((navToggle) => {
          navToggle.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              if (
                this.notification.classList.contains("bls__opend-popup-header")
              ) {
                this.close();
              } else {
                this.open();
              }
            },
            false
          );
        });
      this.currentItemCount = Array.from(
        this.querySelectorAll('[name="updates[]"]')
      ).reduce(
        (total, quantityInput) => total + parseInt(quantityInput.value),
        0
      );
  
      this.debouncedOnChange = debounce((event) => {
        this.onChange(event);
      }, 300);
      this.addEventListener("change", this.debouncedOnChange.bind(this));
      this.cartAction();
      this.countdownTimer();
      this.addonsUpdate();
    }
  
    cartAction() {
      document.querySelectorAll(".close-cart").forEach((navToggle) => {
        navToggle.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            if (this.notification.classList.contains("bls__opend-popup-header")) {
              this.close();
            }
          },
          false
        );
      });
      document.querySelectorAll(".bls__cart-addons button").forEach((button) => {
        button.removeEventListener("click", this.cartAddons.bind(this), false);
        button.addEventListener("click", this.cartAddons.bind(this), false);
      });
  
      document
        .querySelectorAll(".bls__addon-actions .btn-save")
        .forEach((button) => {
          button.removeEventListener(
            "click",
            this.cartAddonsSave.bind(this),
            false
          );
          button.addEventListener("click", this.cartAddonsSave.bind(this), false);
        });
  
      document.querySelectorAll(".bls__add-giftwrap").forEach((giftwrap) => {
        giftwrap.removeEventListener(
          "click",
          this.addGiftwrapClick.bind(this),
          false
        );
        giftwrap.addEventListener(
          "click",
          this.addGiftwrapClick.bind(this),
          false
        );
      });
  
      document.querySelectorAll(".bls-minicart-item-edit").forEach((edit) => {
        edit.removeEventListener("click", this.cartEditItem.bind(this), false);
        edit.addEventListener("click", this.cartEditItem.bind(this), false);
      });
  
      const conditions = document.getElementById("conditions_form_minicart");
      const bpb = document.querySelector(".bls-btn-checkout");
      if (conditions) {
        if (getCookie("term_conditions")) {
          conditions.setAttribute('checked','')
          if (bpb) {
            bpb.removeAttribute("disabled");
          }
        }else{
          conditions.addEventListener("change", (event) => {
            setCookie('term_conditions', 1, 1);
            
            if (bpb) {
              if (event.currentTarget.checked) {
                bpb.removeAttribute("disabled");
              } else {
                bpb.setAttribute("disabled", "disabled");
              }
            }
          });
        }
      }
  
      document
        .querySelectorAll(".bls__addon-actions .btn-cancel")
        .forEach((addonCancel) => {
          addonCancel.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              target.closest(".bls__addon").classList.remove("is-open");
              target
                .closest(".bls-minicart-wrapper")
                .classList.remove("addons-open");
            },
            false
          );
        });
  
      document
        .querySelectorAll(".bls__addon-actions .btn-cancel")
        .forEach((addonCancel) => {
          addonCancel.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              target.closest(".bls__addon").classList.remove("is-open");
              target
                .closest(".bls-minicart-wrapper")
                .classList.remove("addons-open");
            },
            false
          );
        });
    }
  
    addonsUpdate() {
      const address_country = document.getElementById("address_country");
      const address_province = document.getElementById("address_province");
      if (address_country && address_province) {
        new Shopify.CountryProvinceSelector(
          "address_country",
          "address_province",
          { hideElement: "address_province_container" }
        );
      }
  
      const bls__discount_code = document.querySelector(".bls__discount_code");
      const code = localStorage.getItem("discount_code");
      if (code && bls__discount_code) {
        document.querySelector(".bls__discount_code").value = code;
      }
    }
  
    cartAddons(event) {
      event.preventDefault();
      const target = event.currentTarget;
      const open = target.getAttribute("data-open");
      if (
        !document.getElementById("bls__" + open).classList.contains("is-open")
      ) {
        document.getElementById("bls__" + open).classList.add("is-open");
        target.closest(".bls-minicart-wrapper").classList.add("addons-open");
        if (open == "shipping") {
          const address_country = document.getElementById("address_country");
          const address_province = document.getElementById("address_province");
          if (address_country && address_province) {
            new Shopify.CountryProvinceSelector(
              "address_country",
              "address_province",
              { hideElement: "address_province_container" }
            );
          }
        }
      } else {
        document.getElementById("bls__" + open).classList.remove("is-open");
        target.closest(".bls-minicart-wrapper").classList.remove("addons-open");
      }
    }
  
    cartEditItem(event) {
      event.preventDefault();
      const target = event.currentTarget;
      const key = target.getAttribute("data-key");
      const quantity = target.getAttribute("data-quantity");
      const href = target.getAttribute("href");
      const variant =
        href.indexOf("?") > -1 ||
        href.indexOf("?variant=") > -1 ||
        href.indexOf("&variant=") > -1
          ? "&"
          : "/?";
      target.closest(".cart-item").classList.add("loadding");
      fetch(`${window.shopUrl}${href}${variant}section_id=cart-quick-edit`)
        .then((response) => {
          if (!response.ok) {
            var error = new Error(response.status);
            throw error;
          }
          return response.text();
        })
        .then((response) => {
          const resultsMarkup = new DOMParser()
            .parseFromString(response, "text/html")
            .getElementById("shopify-section-cart-quick-edit");
          var quick_edit = EasyDialogBox.create(
            "cart-edit-item",
            "dlg dlg-disable-footer dlg-disable-drag",
            cartStrings?.quick_edit,
            resultsMarkup.innerHTML
          );
          quick_edit.onClose = quick_edit.destroy;
          quick_edit.show();
        })
        .catch((error) => {
          throw error;
        })
        .finally(() => {
          if (document.querySelector("[data-template-quick-cart-edit]")) {
            document
              .querySelector("[data-template-quick-cart-edit]")
              .setAttribute("data-line", key);
          }
          if (
            document.querySelector(
              ".product-form-quick-edit quantity-input input"
            )
          ) {
            document.querySelector(
              ".product-form-quick-edit quantity-input input"
            ).value = quantity;
          }
          target.closest(".cart-item").classList.remove("loadding");
          BlsColorSwatchesShopify.init();
          BlsLazyloadImg.init();
        });
    }
  
    cartAddonsSave(event) {
      event.preventDefault();
      const target = event.currentTarget;
      const action = target.getAttribute("data-action");
      if (action == "coupon") {
        const value = document.querySelector(".bls__discount_code").value;
        localStorage.setItem("discount_code", value);
        document.getElementById("bls__" + action).classList.remove("is-open");
        document
          .querySelector(".bls-minicart-wrapper")
          .closest(".bls-minicart-wrapper")
          .classList.remove("addons-open");
      } else if (action == "note") {
        const body = JSON.stringify({
          note: document.querySelector(".bls__cart-note").value,
        });
        fetch(`${routes?.cart_update_url}`, { ...fetchConfig(), ...{ body } });
        document.getElementById("bls__" + action).classList.remove("is-open");
        document
          .querySelector(".bls-minicart-wrapper")
          .closest(".bls-minicart-wrapper")
          .classList.remove("addons-open");
      } else if (action == "shipping") {
        var e = {};
        (e.zip = document.querySelector("#AddressZip").value || ""),
          (e.country = document.querySelector("#address_country").value || ""),
          (e.province = document.querySelector("#address_province").value || ""),
          this._getCartShippingRatesForDestination(e);
      }
    }
  
    _getCartShippingRatesForDestination(event) {
      fetch(
        `${window.Shopify.routes.root}cart/shipping_rates.json?shipping_address%5Bzip%5D=${event.zip}&shipping_address%5Bcountry%5D=${event.country}&shipping_address%5Bprovince%5D=${event.province}`
      )
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const message = document.querySelector(".bls__addon-message");
          for (var item of document.querySelectorAll(".bls__addon-message p")) {
            item.remove();
          }
          const {showDeliveryDays,deliveryDayOne,deliveryDaysOther} = message.dataset;
          const parsedState = JSON.parse(state);
          if (parsedState && parsedState.shipping_rates) {
            if (parsedState.shipping_rates.length > 0) {
              message.classList.remove("error", "warning");
              message.classList.add("success");
              const p = document.createElement("p");
              p.innerText = cartStrings?.shipping_rate.replace(
                "{{address}}",
                event.zip + ", " + event.country + " " + event.province
              );
              message.appendChild(p);
              parsedState.shipping_rates.map((rate) => {
                let daysShipping = "";
                if (rate.delivery_days.length > 0 && showDeliveryDays == 'true') {
                  let typeDay = deliveryDayOne;
                  const day = rate.delivery_days[0];
                  const dayAt = rate.delivery_days.at(-1);
                  if (day > 1) typeDay = deliveryDaysOther;
                  if (day === dayAt) {
                    daysShipping = `(${day} ${typeDay})`
                  }else{
                    daysShipping = `(${day} - ${dayAt} ${typeDay})`
                  }
                }
                const rateNode = document.createElement("p");
                rateNode.innerHTML =
                  rate.name +
                  ": " +
                  Shopify.formatMoney(rate.price, cartStrings?.money_format)+" "+ daysShipping;
                message.appendChild(rateNode);
              });
            } else {
              message.classList.remove("error", "success");
              message.classList.add("warning");
              const p = document.createElement("p");
              p.innerText = cartStrings?.no_shipping;
              message.appendChild(p);
            }
          } else {
            message.classList.remove("success", "warning");
            message.classList.add("error");
            Object.entries(parsedState).map((error) => {
              const message_error = `${error[1][0]}`;
              const p = document.createElement("p");
              p.innerText = message_error;
              message.appendChild(p);
            });
          }
        })
        .catch((error) => {
          throw error;
        });
    }
  
    addGiftwrapClick(event) {
      event.preventDefault();
      const target = event.currentTarget;
      const variant_id = target.getAttribute("data-variant-id");
      const config = fetchConfig("json");
      config.body = JSON.stringify({
        id: Number(variant_id),
        quantity: 1,
        sections: this.getSectionsToRender().map((section) => section.id),
        sections_url: window.location.pathname,
      });
      target.classList.add("loading");
      fetch(`${routes?.cart_add_url}`, config)
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);
          fetch("/cart.json")
            .then((res) => res.json())
            .then((cart) => {
              if (cart.item_count != undefined) {
                document.querySelectorAll(".cart-count").forEach((el) => {
                  if (el.classList.contains('cart-count-drawer')) {
                    el.innerHTML = `(${cart.item_count})`;
                    }else{
                    el.innerHTML = cart.item_count;
                    }
                });
                if (document.querySelector("header-total-price")) {
                  document.querySelector("header-total-price").updateTotal(cart);
                }
                const cart_free_ship = document.querySelector(
                  "free-ship-progress-bar"
                );
                if (cart_free_ship) {
                  cart_free_ship.init(cart.items_subtotal_price);
                }
              }
            })
            .catch((error) => {
              throw error;
            });
          this.getSectionsToRender().forEach((section) => {
            const elementToReplace = document.getElementById(section.id);
            const html = new DOMParser().parseFromString(
              parsedState.sections[section.id],
              "text/html"
            );
            elementToReplace.innerHTML =
              html.querySelector("#form-mini-cart").innerHTML;
              const cartUpsell = document.querySelector('.bls-recommendations-beside');
                const html_cartUpsell = html.querySelector('.bls-recommendations-beside');
                const html_cartUpselSelected = html.querySelector('.bls-recommendations-beside-selected');
                var counteSelect;
                if (cartUpsell && html_cartUpsell) {
                  if (html_cartUpselSelected) {
                    counteSelect = Array.from(html_cartUpselSelected.getElementsByClassName('bls-cart-upsell-item'));
                    if (counteSelect.length == 0) {
                      cartUpsell.classList.remove('is-opend')
                    }
                  }
                  
                  if (!counteSelect || counteSelect.length != 0) {
                    setTimeout(() => {
                      cartUpsell.classList.add("is-opend");
                    }, 1500);
                  }
                  cartUpsell.innerHTML = html_cartUpsell.innerHTML
                }
          });
          this.cartAction();
        })
        .catch((e) => {
          throw e;
        })
        .finally(() => {
          document
            .querySelector(".bls__add-giftwrap")
            .classList.remove("loading");
          document.getElementById("bls__gift").classList.remove("is-open");
          document
            .querySelector(".bls-minicart-wrapper")
            .classList.remove("addons-open");
          Shopify.termsConditionsAction();
          BlsLazyloadImg.init();
          BlsSettingsSwiper.init();
          
        });
    }
  
    onChange(event) {
      if (event.target.getAttribute("name") == "updates[]")
        this.updateQuantity(
          event.target.dataset.id,
          event.target.value,
          event.target.dataset.value,
          event.target,
          document.activeElement.getAttribute("name")
        );
    }
  
    updateQuantity(id, quantity, currentQuantity, _this, name) {
      quantity = quantity ? quantity : 0;
      const body = JSON.stringify({
        id,
        quantity,
        sections: this.getSectionsToRender().map((section) => section.id),
        sections_url: window.location.pathname,
      });
      this.notification.classList.add("start", "loading");
      const cart_free_ship = document.querySelector("free-ship-progress-bar");
      fetch(`${routes?.cart_change_url}`, { ...fetchConfig(), ...{ body } })
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);
          if (parsedState.item_count != undefined) {
            document.querySelectorAll(".cart-count").forEach((el) => {
              if (el.classList.contains('cart-count-drawer')) {
                el.innerHTML = `(${parsedState.item_count})`;
                }else{
                el.innerHTML = parsedState.item_count;
                }
            });
            if (document.querySelector("header-total-price")) {
              document
                .querySelector("header-total-price")
                .updateTotal(parsedState);
            }
          }
          if (document.querySelector(".quantity__label")) {
            const items = parsedState.items;
            const pro_id = document.querySelector(".quantity__label").getAttribute('data-pro-id');
            var variant_id,variant_quantity;
            items.forEach(function(item){
              variant_id = item.variant_id;
              if (variant_id == pro_id) {
                document.querySelector(".quantity-cart").innerHTML = item.quantity;
                document.querySelector(".quantity__label").classList.remove("hidden");
                variant_quantity = pro_id;
                return;
              }
            });
            if (!variant_quantity) {
              document.querySelector(".quantity-cart").innerHTML = 0;
              document.querySelector(".quantity__label").classList.add("hidden");
            }
          }
          
          if (document.querySelector("header-total-price")) {
            document.querySelector("header-total-price").updateTotal(parsedState);
          }
          if (parsedState.item_count == 0 && this.cartCountDown) {
            this.cartCountDown.querySelector(".countdown-message").remove();
          }
          if (parsedState.item_count == 0 && this.cartUpsellBeside) {
            if (this.cartUpsellBeside.classList.contains('is-opend')) {
            this.cartUpsellBeside.classList.remove('is-opend');
              }
          }
          if (!parsedState.error && parsedState.item_count != undefined) {
            this.getSectionsToRender().forEach((section) => {
              const elementToReplace = document.getElementById(section.id);
              const html = new DOMParser().parseFromString(
                parsedState.sections[section.id],
                "text/html"
              );
              elementToReplace.innerHTML =
                html.querySelector("#form-mini-cart").innerHTML;
              if (cart_free_ship) {
                cart_free_ship.init(parsedState.items_subtotal_price);
              }
            });
          } else {
            const content = document.querySelector(".form-infor .add-cart-error");
            if (!content) return;
            var error_message = EasyDialogBox.create(
              "add_cart_error",
              "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
              "",
              content.innerHTML
            );
            error_message.onClose = error_message.destroy;
            error_message.show();
            if (!_this) return;
            _this.value = currentQuantity;
          }
          this.cartAction();
        })
        .catch((e) => {
          throw e;
        })
        .finally(() => {
          Shopify.termsConditionsAction();
          this.notification.classList.add("finish");
          setTimeout(function () {
            this.cart = document.querySelector("cart-notification");
            this.cart
              .querySelector(".header_minicart")
              .classList.remove("start", "loading", "finish");
          }, 500);
          BlsLazyloadImg.init();
          BlsSettingsSwiper.init();
          
        });
    }
  
    countdownTimer() {
      if (!this.cartCountDown) return;
      const duration = Number(this.cartCountDown.dataset.countdownTime) || 5;
      const message = this.cartCountDown.dataset.timeoutMessage;
      const endTime = this.startTime + duration * 60 * 1000;
      const countdown_timer = setInterval(() => {
        if (!document.querySelector(".cart-countdown-time .countdown-message")) {
          clearInterval(countdown_timer);
        } else {
          if (this.startTime > endTime) {
            this.cartCountDown.querySelector(".countdown-message").innerHTML =
              message;
            clearInterval(countdown_timer);
          } else {
            var distance = endTime - this.startTime;
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            document.querySelector(".countdown-timer-minute").innerHTML = minutes;
            document.querySelector(".countdown-timer-sec").innerHTML = seconds;
          }
          this.startTime += 1000;
        }
      }, 1000);
    }
  
    open() {
      this.notification.classList.add("bls__opend-popup-header");
      document.documentElement.classList.add("hside_opened");
      this.notification.addEventListener(
        "transitionend",
        () => {
          this.notification.focus();
        },
        { once: true }
      );
      document.body.addEventListener("click", this.onBodyClick);
    }

    closeBeside(){
      document.querySelector('.bls-recommendations-beside').classList.remove('is-opend');
    }
  
    close() {
      this.notification.classList.remove("bls__opend-popup-header");
      document.documentElement.classList.remove("hside_opened");
      if (document.querySelector('.bls-recommendations-beside')) {
        document.querySelector('.bls-recommendations-beside').classList.remove('is-opend');
      }
      document.body.removeEventListener("click", this.onBodyClick);
      for (var item of document.querySelectorAll(".bls__addon")) {
        item.classList.remove("is-open");
      }
      for (var item of document.querySelectorAll(".bls-minicart-wrapper")) {
        item.classList.remove("addons-open");
      }
    }
  
    getSectionsToRender() {
      return [
        {
          id: "form-mini-cart",
        },
      ];
    }
  
    getSectionInnerHTML(html, selector = ".shopify-section") {
      return new DOMParser()
        .parseFromString(html, "text/html")
        .querySelector(selector).innerHTML;
    }
  
    setActiveElement(element) {
      this.activeElement = element;
    }
  }
  customElements.define("cart-notification", CartNotification);
  
  class MiniCartRemoveButton extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("click", (event) => {
        event.preventDefault();
        const wishlist_items = JSON.parse(
          localStorage.getItem("bls__wishlist-items")
        );
        const productHandle = this.dataset.productHandle;
        let index = wishlist_items?.indexOf(productHandle);
        if (this.classList.contains("bls-action-add-wishlist") ) {
            if (index == -1 || index == undefined) {
              this.closest(".cart-item").querySelector('.bls-minicart-wishlist').style.display = "block"
              this.closest(".cart-item").querySelector('.bls-minicart-product-info').style.display = "none"
            }else{
              const cartItems = this.closest("cart-notification");
              cartItems.updateQuantity(this.dataset.index, 0);
            }
        }
        else{
          const cartItems = this.closest("cart-notification");
          cartItems.updateQuantity(this.dataset.index, 0);
        }
        
      });
    }
  }
  customElements.define("mini-cart-remove-button", MiniCartRemoveButton);

    
  class MiniCartWishlistAction extends HTMLElement {
    constructor() {
      super();
      this.actionRemoveWishlist()
      this.actionAddWishlist()
      this.actionClose()
    }

    actionRemoveWishlist(){
      this.querySelector('.btn-minicart-remove-js').addEventListener("click", (event) => {
        event.preventDefault();
        const target = event.currentTarget
        this.eventRemove(target)
        
      });
    }

    actionAddWishlist(){
      this.querySelector('.btn-minicart-add-wishlist-js').addEventListener("click", (event) => {
        event.preventDefault();
        BlsSubActionProduct.handleWishlistFunctionClick(event);
        const target = event.currentTarget
        this.eventRemove(target)
      })
    }

    eventRemove(target){
      const cartItems = target.closest("cart-notification");
      cartItems.updateQuantity(target.dataset.index, 0);
    }

    actionClose(){
      document.querySelectorAll('.cart-close-wishlist').forEach(items => {
        items.addEventListener('click', (e) => {
          const target = e.currentTarget;
          e.preventDefault();
          target.closest(".cart-item").querySelector('.bls-minicart-wishlist').style.display = "none"
          target.closest(".cart-item").querySelector('.bls-minicart-product-info').style.display = "block"
        })
      })
    }
  }
  customElements.define("minicart-wishlist-action", MiniCartWishlistAction);
  
  class VariantSelectsQuickEdit extends HTMLElement {
    constructor() {
      super();
      this.querySelectorAll(".bls__option-swatch").forEach((button) =>
        button.addEventListener("click", this.onVariantChange.bind(this), false)
      );
    }
  
    onVariantChange(event) {
      event.preventDefault();
      const target = event.currentTarget;
      const value = target.getAttribute("data-value");
      for (var item of target
        .closest("fieldset")
        .querySelectorAll(".bls__option-swatch")) {
        item.classList.remove("active");
      }
      target.classList.toggle("active");
      target
        .closest("fieldset")
        .querySelector(".swatch-selected-value").textContent = value;
      this.options = Array.from(
        this.querySelectorAll(".bls__option-swatch.active"),
        (select) => select.getAttribute("data-value")
      );
      this.updateMasterId();
      this.toggleAddButton(true, "", false);
      if (!this.currentVariant) {
        this.toggleAddButton(true, "", true);
        this.setUnavailable();
      } else {
        this.updateMedia();
        this.updateVariantInput();
        this.renderProductInfo();
      }
    }
  
    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options
          .map((option, index) => {
            return this.options[index] === option;
          })
          .includes(false);
      });
    }
  
    updateMedia() {
      if (!this.currentVariant) return;
      if (!this.currentVariant.featured_media) return;
      const form = document.getElementById(
        `product-form-quick-edit-${this.dataset.section}`
      );
      form.querySelector(".product__media img").removeAttribute("srcset");
      form
        .querySelector(".product__media img")
        .setAttribute(
          "src",
          this.currentVariant.featured_media.preview_image.src
        );
    }
  
    updateVariantInput() {
      const productForms = document.querySelectorAll(
        `#product-form-quick-edit-${this.dataset.section}`
      );
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
  
    renderProductInfo() {
      if (!this.currentVariant) return;
      const compare_at_price = this.currentVariant.compare_at_price;
      const price = this.currentVariant.price;
      const price_format = Shopify.formatMoney(
        this.currentVariant.price,
        cartStrings?.money_format
      );
      const form = document.getElementById(
        `product-form-quick-edit-${this.dataset.section}`
      );
      form.querySelector(".price__regular .price").innerHTML = price_format;
      const bls__price = form.querySelector(".bls__price");
      bls__price.classList.remove("price--sold-out", "price--on-sale");
      bls__price
        .querySelector(".price__regular .price")
        .classList.remove("special-price");
      if (compare_at_price && compare_at_price > price) {
        const compare_format = Shopify.formatMoney(
          compare_at_price,
          cartStrings?.money_format
        );
        if (!bls__price.querySelector(".compare-price")) {
          var ps = bls__price.querySelector(".price__sale");
          var sp = document.createElement("span");
          var cp = document.createElement("s");
          cp.classList.add("price-item", "compare-price");
          sp.appendChild(cp);
          if (ps) {
            ps.appendChild(sp);
          }
        }
        if (bls__price.querySelector(".compare-price")) {
          bls__price.querySelector(".compare-price").innerHTML = compare_format;
        }
        bls__price.classList.add("price--on-sale");
        bls__price
          .querySelector(".price__regular .price")
          .classList.add("special-price");
      } else if (!this.currentVariant.available) {
        bls__price.classList.add("price--sold-out");
      }
      this.toggleAddButton(
        !this.currentVariant.available,
        window.variantStrings?.soldOut
      );
    }
  
    toggleAddButton(disable = true, text, modifyClass = true) {
      const productForm = document.getElementById(
        `product-form-quick-edit-${this.dataset.section}`
      );
      if (!productForm) return;
      const addButton = productForm.querySelector('[name="add"]');
      const addButtonText = productForm.querySelector('[name="add"] > span');
      const buttonPayment = productForm.querySelector('.bls__product-dynamic-checkout');
      if (!addButton) return;
  
      if (disable) {
        addButton.setAttribute("disabled", "disabled");
        if (text) addButtonText.textContent = text;
      } else {
        addButton.removeAttribute("disabled");
        addButtonText.textContent = window.variantStrings?.addToCart;
      }
  
      if (!modifyClass) return;
    }
  
    setUnavailable() {
      const button = document.getElementById(
        `product-form-quick-edit-${this.dataset.section}`
      );
      const addButton = button.querySelector('[name="add"]');
      const addButtonText = button.querySelector('[name="add"] > span');
      const price = document.getElementById(`price-${this.dataset.section}`);
      if (!addButton) return;
      addButtonText.textContent = window.variantStrings?.unavailable;
      if (price) price.classList.add("visibility-hidden");
    }
  
    getVariantData() {
      this.variantData =
        this.variantData ||
        JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
  }
  customElements.define("variant-radios-quick-edit", VariantSelectsQuickEdit);
  
  if (!customElements.get("product-form-quick-edit")) {
    customElements.define(
      "product-form-quick-edit",
      class ProductForm extends HTMLElement {
        constructor() {
          super();
          this.form = this.querySelector("form");
          this.form.querySelector("[name=id]").disabled = false;
          this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
          this.cart =
            document.querySelector("cart-notification") ||
            document.querySelector("cart-drawer");
          this.submitButton = this.querySelector('[type="submit"]');
          if (document.querySelector("cart-drawer"))
            this.submitButton.setAttribute("aria-haspopup", "dialog");
        }
  
        onSubmitHandler(evt) {
          evt.preventDefault();
          this.handleErrorMessage();
          this.submitButton.setAttribute("disabled", true);
          this.submitButton.classList.add("btn-loading");
          const quick = document.getElementById("product-form-quick-edit");
          const id = quick.getAttribute("data-line");
          const quantity = 0;
          const config_change = fetchConfig("json");
          config_change.body = JSON.stringify({
            id,
            quantity,
          });
          fetch(`${routes?.cart_change_url}`, config_change)
            .then((response) => {
              return response.text();
            })
            .catch((e) => {
              throw e;
            })
            .finally(() => {
              this.addCartAdd();
            });
        }
  
        addCartAdd() {
          const config = fetchConfig("json");
          config.headers["X-Requested-With"] = "XMLHttpRequest";
          delete config.headers["Content-Type"];
          const formData = new FormData(this.form);
          if (this.cart) {
            formData.append(
              "sections",
              this.cart.getSectionsToRender().map((section) => section.id)
            );
            formData.append("sections_url", window.location.pathname);
            this.cart.setActiveElement(document.activeElement);
          }
          config.body = formData;
          fetch(`${routes?.cart_add_url}`, config)
            .then((response) => {
              return response.text();
            })
            .then((state) => {
              this.submitButton.setAttribute("disabled", true);
              this.submitButton.querySelector("span").classList.add("hidden");
              fetch("/cart.json")
                .then((res) => res.json())
                .then((cart) => {
                  if (cart.item_count != undefined) {
                    document.querySelectorAll(".cart-count").forEach((el) => {
                      if (el.classList.contains('cart-count-drawer')) {
                        el.innerHTML = `(${cart.item_count})`;
                        }else{
                        el.innerHTML = cart.item_count;
                        }
                    });
                    if (document.querySelector("header-total-price")) {
                      document
                        .querySelector("header-total-price")
                        .updateTotal(cart);
                    }
                    const cart_free_ship = document.querySelector(
                      "free-ship-progress-bar"
                    );
                    if (cart_free_ship) {
                      cart_free_ship.init(cart.items_subtotal_price);
                    }
                  }
                })
                .catch((error) => {
                  throw error;
                });
              const parsedState = JSON.parse(state);
              if (!parsedState.errors) {
                this.cart.getSectionsToRender().forEach((section) => {
                  const elementToReplace = document.getElementById(section.id);
                  const html = new DOMParser().parseFromString(
                    parsedState.sections[section.id],
                    "text/html"
                  );
                  elementToReplace.innerHTML =
                    html.querySelector("#form-mini-cart").innerHTML;
                  const countdown = this.cart.querySelector(
                    ".cart-countdown-time"
                  );
                  const html_countdown = html.querySelector(
                    ".cart-countdown-time"
                  );
                  if (countdown && html_countdown) {
                    countdown.innerHTML = html_countdown.innerHTML;
                    this.cart.countdownTimer();
                  }
                  const cartUpsell = this.cart.querySelector('.bls-recommendations-beside');
                const html_cartUpsell = html.querySelector('.bls-recommendations-beside');
                const html_cartUpselSelected = html.querySelector('.bls-recommendations-beside-selected');
                var counteSelect;
                if (cartUpsell && html_cartUpsell) {
                  if (html_cartUpselSelected) {
                    counteSelect = Array.from(html_cartUpselSelected.getElementsByClassName('bls-cart-upsell-item'));
                    if (counteSelect.length == 0) {
                      cartUpsell.classList.remove('is-opend')
                    }
                  }
                  
                  if (!counteSelect || counteSelect.length != 0) {
                    setTimeout(() => {
                      cartUpsell.classList.add("is-opend");
                    }, 1500);
                  }
                  cartUpsell.innerHTML = html_cartUpsell.innerHTML
                }
                });
                this.cart.cartAction();
                document.querySelector(".dlg-close-x").click();
              } else {
                const content = document.querySelector(
                  ".form-infor .add-cart-error"
                );
                if (!content) return;
                var error_message = EasyDialogBox.create(
                  "add_cart_error",
                  "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                  "",
                  content.innerHTML
                );
                let cart_quick_edit = EasyDialogBox.getById("cart-edit-item_0");
                if (cart_quick_edit) {
                  cart_quick_edit.onHide = cart_quick_edit.destroy;
                  cart_quick_edit.hide();
                }
                error_message.onClose = error_message.destroy;
                error_message.show();
              }
            })
            .catch((e) => {
              throw e;
            })
            .finally(() => {
              this.submitButton.classList.remove("btn-loading");
              if (this.cart && this.cart.classList.contains("is-empty"))
                this.cart.classList.remove("is-empty");
              if (!this.error) this.submitButton.removeAttribute("disabled");
              this.submitButton.querySelector("span").classList.remove("hidden");
              Shopify.termsConditionsAction();
              BlsLazyloadImg.init();
            });
        }
  
        handleErrorMessage(errorMessage = false) {
          this.errorMessageWrapper =
            this.errorMessageWrapper ||
            this.querySelector(".product-form__error-message-wrapper");
          if (!this.errorMessageWrapper) return;
          this.errorMessage =
            this.errorMessage ||
            this.errorMessageWrapper.querySelector(
              ".product-form__error-message"
            );
  
          this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);
  
          if (errorMessage) {
            this.errorMessage.textContent = errorMessage;
          }
        }
      }
    );
  }
  
  class VariantRadiosQuickview extends HTMLElement {
    constructor() {
      super();
      this.querySelectorAll(".bls__option-swatch").forEach((button) =>
        button.addEventListener("click", this.onVariantChange.bind(this), false)
      );
      this.actionDropdownSwatches();
    }
  
    onVariantChange(event) {
      event.preventDefault();
      const target = event.currentTarget;
      const value = target.getAttribute("data-value");
      for (var item of target
        .closest("fieldset")
        .querySelectorAll(".bls__option-swatch")) {
        item.classList.remove("active");
      }
      target.classList.toggle("active");
      target
        .closest("fieldset")
        .querySelector(".swatch-selected-value").textContent = value;
      this.options = Array.from(
        this.querySelectorAll(".bls__option-swatch.active"),
        (select) => select.getAttribute("data-value")
      );
      this.updateMasterId();
      this.toggleAddButton(true, "", false);
      this.updateVariantStatuses();
      if (!this.currentVariant) {
        this.toggleAddButton(true, "", true);
        this.setUnavailable();
      } else {
        this.updateVariantInput();
        this.renderProductInfo();
      }
    }
  
    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options
          .map((option, index) => {
            return this.options[index] === option;
          })
          .includes(false);
      });
    }
  
    updateVariantInput() {
      const productForms = document.querySelectorAll(
        `#product-form-${this.dataset.section}`
      );
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        if (input) {
          input.value = this.currentVariant.id;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }
  
    renderProductInfo() {
      if (!this.currentVariant) return;
      let qty = 0;
      let percent = 0;
      let sale = false;
      let availability = window.variantStrings?.inStock;
      let variantStrings = window.variantStrings?.soldOut;
      const compare_at_price = this.currentVariant.compare_at_price;
      const price = this.currentVariant.price;
      const unit_price = this.currentVariant.unit_price;
      const unit_price_measurement = this.currentVariant.unit_price_measurement;
      const form = document.getElementById(
        `product-form-${this.dataset.section}`
      );
      const quickview = form.closest(".bls__product-quickview");
      this.getVariantQtyData().find((variantQty) => {
        if (variantQty.id === this.currentVariant.id) {
          qty = variantQty.qty;
        }
      });
      if (compare_at_price && compare_at_price > price) {
        sale = true;
        percent = ((compare_at_price - price) / compare_at_price) * 100;
      }
      if (this.currentVariant.available && qty < 1) {
        availability = window.variantStrings?.preOrder;
        variantStrings = window.variantStrings?.preOrder;
      } else if (!this.currentVariant.available) {
        availability = window.variantStrings?.outStock;
      } else {
        availability = window.variantStrings?.inStock;
        variantStrings = window.variantStrings?.addToCart;
      }
      if (this.currentVariant.inventory_management === null) {
        availability = window.variantStrings?.inStock;
        variantStrings = window.variantStrings?.addToCart;
      }
      if (quickview.querySelector(".bls__availability-value")) {
        quickview.querySelector(".bls__availability-value").textContent =
          availability;
      }
      const product_label = quickview.querySelector(".bls__product-label");
      if (product_label) {
        product_label.remove();
      }
      if (sale) {
        var element = document.createElement("div");
        element.classList.add(
          "bls__product-label",
          "mb-5",
          "fs-12",
          "pointer-events-none",
          "inline-block",
          "static"
        );
        quickview
          .querySelector(".bls__quickview-content")
          .insertBefore(
            element,
            quickview.querySelector(".bls__quickview-content").children[0]
          );
        const label = quickview.querySelector(".bls__product-label");
        var element_sale = document.createElement("div");
        element_sale.classList.add("bls__sale-label");
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
        if (label) {
          label.appendChild(element_sale);
        }
      }
  
      if (quickview.querySelector(".bls__product-sku-value")) {
        quickview.querySelector(".bls__product-sku-value").textContent =
          this.currentVariant.sku;
      }
  
      const price_format = Shopify.formatMoney(
        this.currentVariant.price,
        cartStrings?.money_format
      );
      if (unit_price && unit_price_measurement) {
        const price_num = Shopify.formatMoney(
          unit_price,
          cartStrings?.money_format
        );
        const price_unit =
          unit_price_measurement.reference_value != 1
            ? unit_price_measurement.reference_value
            : unit_price_measurement.reference_unit;
        const upn = quickview.querySelector(".unit-price .number");
        const upu = quickview.querySelector(".unit-price .unit");
        if (upn) {
          upn.innerHTML = price_num;
        }
        if (upu) {
          upu.innerHTML = price_unit;
        }
      }
      const upp = quickview.querySelector(".price__regular .price");
      if (upp) {
        upp.innerHTML = price_format;
      }
  
      const stockNotify = quickview.querySelector(".product-notify-stock");
      if (stockNotify) {
        if (!this.currentVariant.available) {
          stockNotify.style.display = "block";
          stockNotify.setAttribute(
            "data-product-variant",
            this.currentVariant.id
          );
        } else {
          stockNotify.style.display = "none";
          stockNotify.setAttribute(
            "data-product-variant",
            this.currentVariant.id
          );
        }
      }
  
      const bls__price = quickview.querySelector(".bls__price");
      bls__price.classList.remove("price--sold-out", "price--on-sale");
      bls__price
        .querySelector(".price__regular .price")
        .classList.remove("special-price");
      if (compare_at_price && compare_at_price > price) {
        const compare_format = Shopify.formatMoney(
          compare_at_price,
          cartStrings?.money_format
        );
        if (!bls__price.querySelector(".compare-price")) {
          var ps = bls__price.querySelector(".price__sale");
          var sp = document.createElement("span");
          var cp = document.createElement("s");
          cp.classList.add("price-item", "compare-price");
          sp.appendChild(cp);
          if (ps) {
            ps.appendChild(sp);
          }
        }
        if (bls__price.querySelector(".compare-price")) {
          bls__price.querySelector(".compare-price").innerHTML = compare_format;
        }
        bls__price.classList.add("price--on-sale");
        bls__price
          .querySelector(".price__regular .price")
          .classList.add("special-price");
      } else if (!this.currentVariant.available) {
        bls__price.classList.add("price--sold-out");
      }
      this.toggleAddButton(!this.currentVariant.available, variantStrings);
    }
  
    toggleAddButton(disable = true, text, modifyClass = true) {
      const productForm = document.getElementById(
        `product-form-${this.dataset.section}`
      );
      if (!productForm) return;
      const addButton = productForm.querySelector('.button-add-cart-qv[name="add"]');
      const addButtonText = productForm.querySelector('.button-add-cart-qv[name="add"] > span');
      const buttonPayment = productForm.querySelector('.bls__product-dynamic-checkout');

      if (!addButton) return;
      if (disable) {
        buttonPayment.style.display = 'none';
        addButton.setAttribute("disabled", "disabled");
      } else {
        buttonPayment.style.display = 'block';
        addButton.removeAttribute("disabled");
      }
      if (text) addButtonText.textContent = text;
  
      if (!modifyClass) return;
    }
  
    setUnavailable() {
      const button = document.getElementById(
        `product-form-${this.dataset.section}`
      );
      const addButton = button.querySelector('[name="add"]');
      const addButtonText = button.querySelector('[name="add"] > span');
      const price = document.getElementById(`price-${this.dataset.section}`);
      if (!addButton) return;
      addButtonText.textContent = window.variantStrings?.unavailable;
      if (price) price.classList.add("visibility-hidden");
    }
  
    getVariantData() {
      this.variantData =
        this.variantData ||
        JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
    actionDropdownSwatches() {
      this.querySelectorAll("[data-swatches-value]").forEach((items) => {
        items.addEventListener(
          "click",
          (e) => {
            const target = e.currentTarget;
            if (
              !target
                .closest(".bls__color-dropdown")
                .classList.contains("isClicked")
            ) {
              for (var item of this.querySelectorAll(".bls__color-dropdown")) {
                item.classList.remove("isClicked");
              }
              target.closest(".bls__color-dropdown").classList.add("isClicked");
            } else {
              target
                .closest(".bls__color-dropdown")
                .classList.remove("isClicked");
            }
          },
          false
        );
      });
      this.querySelectorAll(".bls__product-color-swatches-dropdown").forEach(
        (swatches) => {
          swatches.addEventListener("click", (e) => {
            const target = e.currentTarget;
            const valueSwatch = target.dataset.value;
            const container = target.closest(".bls__color-dropdown");
            container.querySelector(
              ".bls__color-dropdown-action .bls__color-dropdown-value"
            ).innerHTML = valueSwatch;
            target.closest(".bls__color-dropdown").classList.remove("isClicked");
          });
        }
      );
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
  
    updateVariantStatuses() {
      const selectedOptionOneVariants = this.getVariantData().filter(
        (variant) =>
          this.querySelector(".active").dataset.value === variant.option1
      );
      const inputWrappers = [...this.querySelectorAll(".product-form__input")];
      inputWrappers.forEach((option, index) => {
        if (index === 0) return;
        const optionInputs = [...option.querySelectorAll(".bls__option-swatch")];
        const previousOptionSelected =
          inputWrappers[index - 1].querySelector(".active").dataset.value;
        const availableOptionInputsValue = selectedOptionOneVariants
          .filter(
            (variant) =>
              variant.available &&
              variant[`option${index}`] === previousOptionSelected
          )
          .map((variantOption) => variantOption[`option${index + 1}`]);
        this.setAvailability(optionInputs, availableOptionInputsValue);
      });
    }
    
  
    getVariantData() {
      this.variantData =
        this.variantData ||
        JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
  
    getVariantQtyData() {
      this.variantQtyData = JSON.parse(
        this.querySelector(".productVariantsQty").textContent
      );
      return this.variantQtyData;
    }
  }
  customElements.define("variant-radios-quickview", VariantRadiosQuickview);

  class CartUpsell extends HTMLElement {
    constructor() {
      super();
    }
    init(){
      this.connectedCallback();
    }
    connectedCallback() {
      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('.swiper-wrapper');
          if (recommendations && recommendations.innerHTML.trim().length) {
            if (this.querySelector(".swiper-wrapper")) {
              this.querySelector(".swiper-wrapper").innerHTML = recommendations.innerHTML;
            }
          }
        })
        .finally(() =>{
          BlsSettingsSwiper.init();
          BlsLazyloadImg.init()
          
        })
        .catch(e => {
          console.error(e);
        });
    }
  }
customElements.define('minicart-recommendations', CartUpsell);

class CartUpsellBeside extends HTMLElement {
  constructor() {
    super();
  }
  init(){
    this.connectedCallback();
  }
  connectedCallback() {
    fetch(this.dataset.url)
      .then(response => response.text())
      .then(text => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('.swiper-wrapper');
          if (recommendations && recommendations.innerHTML.trim().length) {
            if (this.querySelector(".swiper-wrapper")) {
              this.querySelector(".swiper-wrapper").innerHTML = recommendations.innerHTML;
            }
          }
        const recommendationsBeside = html.querySelector('.bls-cart-upsell-wrapper');
        const beside = document.querySelector('.bls-recommendations-beside');
        if (recommendationsBeside && recommendationsBeside.innerHTML.trim().length && beside) {
          if (this.querySelector('.bls-cart-upsell-wrapper')) {
            this.querySelector('.bls-cart-upsell-wrapper').innerHTML = recommendationsBeside.innerHTML;
          }
        }
      })
      .finally(() =>{
        BlsSettingsSwiper.init();
        BlsLazyloadImg.init()
        
      })
      .catch(e => {
        console.error(e);
      });
  }
}
customElements.define('minicart-recommendations-beside', CartUpsellBeside);


class CartUpsellHeading extends HTMLElement {
  constructor() {
    super();
    this.querySelector('.button-close-beside').addEventListener('click', (e) => {
      const target = e.currentTarget;
      const closeBeside = target.closest('.bls-recommendations-beside');
      closeBeside.classList.remove('is-opend')
    })
  }
}
customElements.define('minicart-recommendations-heading', CartUpsellHeading);