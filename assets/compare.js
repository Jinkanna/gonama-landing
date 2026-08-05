"use strict";



var BlsComparePageShopify = (function() {
    return {
  
        initCompareItems: function() {
            this.init();
        },
        
        init: function () {
            const compare_items = JSON.parse(localStorage.getItem('bls__compare-items'));
            const compareDiv = document.querySelector('.bls__compare-page-main');
            const div_no_product = compareDiv.querySelector('.bls__compare-no-product-js');
            if (compare_items === null || compare_items.length === 0) {
                div_no_product.classList.remove('d-none');
            }
            else{
                var query = '';
                compare_items.forEach((e, key, compare_items) => {
                    
                    if (!Object.is(compare_items.length - 1, key)) {
                    query += e+'%20OR%20handle:';
                    }
                    else{
                    query += e;
                    }
                })

                    var productAjaxURL = "?view=compare&type=product&options[unavailable_products]=last&q=handle:"+query;
                    fetch(`${window.routes.search_url}${productAjaxURL}`)
                    .then(response => response.text())
                    .then((responseText) => {

                        const html = parser.parseFromString(responseText, 'text/html');
                        const table = compareDiv.querySelector('.bls__compare-table');
                        

                        if(compare_items.length !== 0 ){
                            const basic = document.querySelector('.bls__compare-row-basic');
                            const vendor = document.querySelector('.bls__compare-row-vendor');
                            const availability = document.querySelector('.bls__compare-row-availability');
                            const size = document.querySelector('.bls__compare-row-size');
                            const color = document.querySelector('.bls__compare-row-color');
                            const review = document.querySelector('.bls__compare-row-review');
                            const bpc = html.querySelectorAll('.bls__compare-page-section > .bls__product-compare');
                            if (bpc.length > 0 ) {
                                if (table) {
                                    table.classList.remove('d-none');
                                    const exist_items = table.querySelectorAll('.bls__compare-value');
                                    if (exist_items.length !== 0) {
                                        exist_items.forEach(ei => {
                                            ei.remove();
                                        })
                                    }
                                }
                                bpc.forEach(el => {
                                    basic.innerHTML += el.querySelector('.bls__compare-row-basic').innerHTML;
                                    vendor.innerHTML += el.querySelector('.bls__compare-row-vendor').innerHTML;
                                    availability.innerHTML += el.querySelector('.bls__compare-row-availability').innerHTML;
                                    size.innerHTML += el.querySelector('.bls__compare-row-size').innerHTML;
                                    color.innerHTML += el.querySelector('.bls__compare-row-color').innerHTML;
                                    review.innerHTML += el.querySelector('.bls__compare-row-review').innerHTML;
                                })
                            }else{
                                div_no_product.classList.remove('d-none');
                            }
                        }
                    }).catch((e) => {
                        console.error(e);
                    }).finally(e => {
                        BlsSubActionProduct.handleActionCompare();
                        BlsSubActionProductPreLoad.handleActionPg();
                        BlsSettingsSwiper.BlsSettingsCarousel();
                        BlsReloadSpr.init();
                        BlsLazyloadImg.init();
                    })   
            }
        },
      }
  })();
  BlsComparePageShopify.initCompareItems();