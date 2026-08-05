"use strict";

var BlsWishlistHeader = (function() {
    return {
        init: function() {
          this.handleCount();
        },
        handleCount: function() {
          const wishlist = document.querySelectorAll('.bls-header-wishlist');
          const items = JSON.parse(localStorage.getItem('bls__wishlist-items'));
            wishlist.forEach(item => {
                const numb = item.querySelector('.wishlist-count');
                numb.innerText = items !== null && items.length != 0 ? items.length : 0;
            })
        },
      }
})();

var BlsWishlistLoad = (function() {
    return {
        init: function(productHandle, wishlist_items) {
          const is_page_wishlist = document.querySelector('.bls__wishlist-page-section');
          if (productHandle) {
            const arr_items = [];
            if (wishlist_items === null) {
                arr_items.push(productHandle);
                localStorage.setItem('bls__wishlist-items', JSON.stringify(arr_items));
            }else{
                let index = wishlist_items.indexOf(productHandle);
                arr_items.push(...wishlist_items);
                if (index === -1) {
                    arr_items.push(productHandle);
                    localStorage.setItem('bls__wishlist-items', JSON.stringify(arr_items));
                } else if (index > -1) {
                    arr_items.splice(index, 1);
                    localStorage.setItem('bls__wishlist-items', JSON.stringify(arr_items));
                    if (is_page_wishlist) {
                      const div_no_product = is_page_wishlist.querySelector('.bls__wishlist-no-product-js');
                      const item_remove = document.querySelector('.bls__wishlist-list[data-product-handle="'+ productHandle +'"]');
                      if (item_remove) {
                        item_remove.remove();
                      }
                      if (wishlist_items.length <= 1) {
                        div_no_product.classList.remove('d-none');
                      }
                    }
                }
            }
            BlsSubActionProduct.handleInitWishlist();
          }
        },
      }
  })();

    
  var BlsCompareLoad = (function() {
    return {
        init: function(productTarget, compare_items) {
          const is_page_compare = document.querySelector('.bls__compare-page-section');
          if (productTarget) {
            const productHandle = productTarget.dataset.productHandle;
            const arr_items = [];
            if (compare_items === null) {
                arr_items.push(productHandle);
                localStorage.setItem('bls__compare-items', JSON.stringify(arr_items));
            }else{
                let index = compare_items.indexOf(productHandle);
                arr_items.push(...compare_items);
                if (index === -1) {
                    arr_items.push(productHandle);
                    localStorage.setItem('bls__compare-items', JSON.stringify(arr_items));
                } else if (index > -1) {
                    arr_items.splice(index, 1);
                    localStorage.setItem('bls__compare-items', JSON.stringify(arr_items));
                    if (is_page_compare) {
                      const div_no_product = is_page_compare.querySelector('.bls__compare-no-product-js');
                      const item_remove = document.querySelectorAll('.bls__compare-value[data-product-handle="'+ productHandle +'"]');
                      if (item_remove.length !== 0) {
                        item_remove.forEach(i => {
                          i.remove();
                        })
                      }

                      if (compare_items.length <= 1) {
                        div_no_product.classList.remove('d-none');
                        const attr_remove = document.querySelector('.bls__compare-table');
                        if (attr_remove) {
                          attr_remove.classList.add('d-none');
                        }
                      }
                    }
                  }
            }
            BlsSubActionProduct.handleInitCompare();
          }
        },
      }
})();

var BlsSubActionProduct = (function() {
    return {
        init: function() {
            this.handleInitQuickviewAction();
            this.handleActionWishlist();
            this.handleInitWishlist();
            this.handleActionCompare();
            this.handleInitCompare();
        },
  
        handleInitQuickviewAction: function() {
          const _this = this;
          const qvbtn = document.querySelectorAll('.bls__product-quickview');
          if (qvbtn.length > 0) {
            qvbtn.forEach(e => {
              e.addEventListener('click', () => {
                e.classList.add('btn-loading');
                const exist_load = e.querySelectorAll('span.loader-icon');
                if (exist_load.length === 0) {
                  const exist_loading = e.querySelectorAll('div.loader-icon');
                  if (exist_loading.length === 0 ) {
                    const spanLoading = document.createElement('div');
                    spanLoading.classList.add('loader-icon');
                    e.appendChild(spanLoading);
                  }
                }
                const productTarget = e.closest('.bls__product-item');
                _this.handleFetchDataQuickView(e, productTarget.dataset.productHandle);
              })
            })
          }
        },

        handleFetchDataQuickView : function (e, handle) {
          const _this = this;
          if (handle) {
            var productAjaxURL = "/products/"+ handle +"/?section_id=product-quickview";
            fetch(productAjaxURL)
            .then(response => response.text())
            .then((responseText) => {
              const html = parser.parseFromString(responseText, 'text/html');
              html.querySelectorAll('#shopify-section-product-quickview').forEach(el => {
                var quickviewBox = EasyDialogBox.create(e, 'dlg dlg-disable-heading dlg-disable-footer dlg-disable-drag', '', el.innerHTML);
                quickviewBox.onClose = quickviewBox.destroy;
                quickviewBox.show();
                BlsColorSwatchesShopify.init();
                BlsReloadSpr.init();
                Shopify.eventFlashSold('dlg');
                Shopify.eventCountDownTimer('dlg');
                Shopify.swiperSlideQickview();
                BlsLazyloadImg.init();
                Shopify.PaymentButton.init();
            })
            }).catch((e) => {
              console.error(e);
            })
            .finally(() => {
              _this.handleActionWishlist();
              _this.handleInitWishlist();
              _this.handleActionCompare();
              _this.handleInitCompare();
              e.classList.remove('btn-loading')
              e.querySelectorAll('.loader-icon').forEach(el => {
                  el.remove();
              })
            });
          }
        },
  
        handleInitWishlist: function () {
          const wishlist_items = JSON.parse(localStorage.getItem('bls__wishlist-items'));
          const wishlist_icon = document.querySelectorAll('.bls__product-wishlist');
          wishlist_icon.forEach(e => {
            const { proAddWishlist, proRemoveWishlist, removeWishlist, action } = e?.dataset;
            const is_page_wishlist = document.querySelector('.bls__wishlist-page-section');
            const tooltip_wishlist = e.querySelector('.bls_tooltip-content');
            const productHandle = e.dataset.productHandle;
            if (wishlist_items !== null) {
              let index = wishlist_items.indexOf(productHandle);
              if (index !== -1) {
                e.querySelector('.bls__product-icon').classList.add('active');
                if (is_page_wishlist) {
                    tooltip_wishlist.innerText = window.stringsTemplate.messageRemoveWishlist;
                } else {
                  if (action === 'remove') {
                    tooltip_wishlist.innerText = removeWishlist;
                  }else {
                    tooltip_wishlist.innerText = proRemoveWishlist;
                  }
                }
              }else{
                e.querySelector('.bls__product-icon').classList.remove('active');
                tooltip_wishlist.innerText = proAddWishlist;
              }
            }
            BlsWishlistHeader.init();
          })
        },
  
        handleActionWishlist: function() {
          const btnWishlist = document.querySelectorAll('.bls__product-wishlist-js');
          if (btnWishlist.length > 0) {
            btnWishlist.forEach((e) => {
              e.addEventListener('click', this.handleWishlistFunctionClick);
            })
          }
          
        },

        handleWishlistFunctionClick: function(evt) {
          const e = evt.currentTarget;
          const wishlist_items = JSON.parse(localStorage.getItem('bls__wishlist-items'));
          const productHandle = e.dataset.productHandle;
          const action = e.dataset.action;
          const is_page_wishlist = document.querySelector('.bls__wishlist-page-section');
          if (is_page_wishlist) {
            BlsWishlistLoad.init(productHandle, wishlist_items);
          }
          const arr_items = [];
          if (wishlist_items === null) {
              arr_items.push(productHandle);
              localStorage.setItem('bls__wishlist-items', JSON.stringify(arr_items));
              BlsSubActionProduct.handleInitWishlist();
          }else{
            let index = wishlist_items.indexOf(productHandle);
            arr_items.push(...wishlist_items);
            if (index === -1) {
                arr_items.push(productHandle);
                localStorage.setItem('bls__wishlist-items', JSON.stringify(arr_items));
                BlsSubActionProduct.handleInitWishlist();
            } else if (index > -1) {
                if (is_page_wishlist) {
                    arr_items.splice(index, 1);
                    localStorage.setItem('bls__wishlist-items', JSON.stringify(arr_items));
                } else {
                  if (action === 'remove') {
                    BlsWishlistLoad.init(productHandle, wishlist_items);
                  }else{
                    window.location.href = `${window.shopUrl}${window.Shopify.routes.root}pages/wishlist`;
                  }
                }
            }
          }
        },

        handleCompareFunctionClick: function(evt) {
          const e = evt.currentTarget;
          const compare_items = JSON.parse(localStorage.getItem('bls__compare-items'));
          const productHandle = e.dataset.productHandle;
          const arr_items = [];
          if (compare_items === null) {
              arr_items.push(productHandle);
              localStorage.setItem('bls__compare-items', JSON.stringify(arr_items));
              BlsSubActionProduct.handleInitCompare();
          }else{
              let index = compare_items.indexOf(productHandle);
              arr_items.push(...compare_items);
              if (index === -1) {
                  arr_items.push(productHandle);
                  localStorage.setItem('bls__compare-items', JSON.stringify(arr_items));
                  BlsSubActionProduct.handleInitCompare();
              } else if (index > -1) {
                window.location.href = `${window.shopUrl}/pages/compare`;
                //   arr_items.splice(index, 1);
                //   localStorage.setItem('bls__compare-items', JSON.stringify(arr_items));
              }
          }
          
        },

        handleInitCompare: function () {
          const compare_items = JSON.parse(localStorage.getItem('bls__compare-items'));
          const compare_icon = document.querySelectorAll('.bls__product-compare');
          const is_page_compare = document.querySelector('.bls__compare-page-section');
          compare_icon.forEach(e => {
            const {
              proAddCompare,
              proRemoveCompare
            } = e?.dataset;
            const tooltip_compare = e.querySelector('.bls_tooltip-content');
            const productHandle = e.dataset.productHandle;
            if (compare_items !== null) {
              let index = compare_items.indexOf(productHandle);
              if (index !== -1) {
                e.querySelector('.bls__product-icon').classList.add('active');
                if (is_page_compare) {
                    tooltip_compare.innerText = window.stringsTemplate.messageRemoveCompare;
                } else {
                    tooltip_compare.innerText = proRemoveCompare;
                }
              }else{
                e.querySelector('.bls__product-icon').classList.remove('active');
                tooltip_compare.innerText = proAddCompare;
              }
            }
          })
        },
  
        handleActionCompare: function() {
            const btnCompare = document.querySelectorAll('.bls__product-compare-js');
            if (btnCompare.length > 0) {
              btnCompare.forEach(e => {
                e.addEventListener('click', this.handleCompareFunctionClick);
              })
            }
        }
      }
  })();
  BlsSubActionProduct.init();



  var BlsSubActionProductPreLoad = (function() {
    return {
        handleActionPg: function() {
          const btnRemoveCompare = document.querySelectorAll('.bls__compare-remove-js');
          if (btnRemoveCompare.length > 0) {
            btnRemoveCompare.forEach(e => {
                e.addEventListener('click', function () {
                  const compare_items = JSON.parse(localStorage.getItem('bls__compare-items'));
                  const productTarget = e.closest('.bls__product-item');
                  if (productTarget) {
                    BlsCompareLoad.init(productTarget, compare_items);
                  }
                })
            })
          }
        }
      }
  })();