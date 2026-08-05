"use strict";


var BlsRVPageShopify = (function() {
    return {
        initRVItems: function() {
            if (window.location.search.indexOf("page=") == -1) {
                const rv_items = JSON.parse(localStorage.getItem('bls__recently-viewed-products'));
                this.init(rv_items);
            }
        },
        
        init: function (rv_items) {
            const _this = this
            const rv_div = document.querySelector('.bls__rv-page-main');
            const div_no_product = rv_div.querySelector('.bls__rv-no-product-js');
            const div_product = rv_div.querySelector('.row');
            if (rv_items === null || rv_items.length === 0) {
                if (div_no_product) {
                    div_no_product.classList.remove('d-none');
                }
                if (div_product) {
                    div_product.classList.add('d-none');
                }
                _this.skeletonFunction(0);
            }else{
                if (div_product) {
                    div_product.classList.remove('d-none');
                }
                var query = '';
                rv_items.forEach((e, key, rv_items) => {
                    if (!Object.is(rv_items.length - 1, key)) {
                        query += e.id + "%20OR%20id:";
                      } else {
                        query += e.id;
                      }
                })

                var productAjaxURL = "?view=rv-products&type=product&options[unavailable_products]=last&q=id:"+query;

                fetch(`${window.routes.search_url}${productAjaxURL}`)
                .then(response => response.text())
                .then((responseText) => {
                    const html = parser.parseFromString(responseText, 'text/html');
                    const row = document.createElement('div');
                    row.classList.add('row');
                    const exist_row = rv_div.querySelector('.row');
                    if (exist_row) {
                        exist_row.remove();
                    }
                    const er = html.querySelector(".bls__rv-page-main > .row")
                    if(rv_items.length !== 0 && er){
                        rv_div.innerHTML = html.querySelector(".bls__rv-page-main").innerHTML;
                        _this.skeletonFunction(700);
                    }else{
                        _this.skeletonFunction(0)
                        div_no_product.classList.remove('d-none');
                    }
                }).catch((e) => {
                    console.error(e);
                }).finally(e => {
                    BlsColorSwatchesShopify.init();
                    BlsSubActionProduct.handleInitQuickviewAction();
                    BlsSubActionProduct.init();
                    BlsLazyloadImg.init();
                    BlsRVPageShopify.clearAll();
                })   
            }
        },
        clearAll: function(){
            const rv_div = document.querySelector('.bls__rv-page-main');
            if (rv_div) {
                if (!rv_div.querySelector(".bls__clear-all-rvp")) return;
                rv_div.querySelector(".bls__clear-all-rvp").addEventListener("click", function () {
                    rv_div.querySelector(".bls__clear-all-rvp").classList.add("d-none");
                    localStorage.removeItem('bls__recently-viewed-products');
                    BlsRVPageShopify.initRVItems();
                })
            }

        },
        skeletonFunction: function (timer) {
            window.setTimeout(function() {
                if (this.document.querySelector('skeleton-page')) {
                  this.document.querySelector('skeleton-page').remove();
                };
                if (this.document.querySelector('.bls__rv-page-section-inner')) {
                    this.document.querySelector('.bls__rv-page-section-inner').classList.remove('d-none');
                };
            },timer);
        }
      }
  })();
  BlsRVPageShopify.initRVItems();