"use strict";
const options = {
    blogLoadMore: '.collections-load-more',
    btnSharing: '.blog-sharing .btn-sharing'
};

var BlsEventBlogShopify = (function() {
    return {
        init: function() {
            this.eventLoadMore();
            this.eventShareBlogPost();
        },

        eventShareBlogPost: function() {
            document.querySelectorAll(options.btnSharing).forEach(share => {
                share.addEventListener("click", event => {
                    event.preventDefault();
                    const target = event.currentTarget;
                    const social = target.getAttribute('data-social');
                    window.open(social);
                }, false);
            });
        },

        eventLoadMore: function() {
            document.querySelectorAll(options.blogLoadMore).forEach(loadMore => {
                var _this = this;
                if (loadMore.classList.contains('infinit-scrolling')) {
                    var observer = new IntersectionObserver(function (entries) {
                        entries.forEach(entry => {
                            entries.forEach(entry => {
                                if (entry.intersectionRatio === 1){
                                    _this.loadMoreProducts(loadMore);
                                }
                            });
                        });
                    }, {threshold: 1.0});
                    observer.observe(loadMore);
                } else {
                    loadMore.addEventListener("click", event => {
                        event.preventDefault();
                        const target = event.currentTarget;
                        _this.loadMoreProducts(target);
                    }, false);
                }
            });
        },

        loadMoreProducts: function(target) {
            const loadMore_url = target.getAttribute('href');
            this.toggleLoading(target, true);
            fetch(`${loadMore_url}`)
                .then((response) => {
                    if (!response.ok) {
                    var error = new Error(response.status);
                    throw error;
                    }
                    return response.text();
                })
                .then(responseText => {
                    const productNodes = parser.parseFromString(responseText, 'text/html');
                    const productNodesHtml = productNodes.querySelectorAll('#bls__blog-container .bls__blog-posts-item');
                    productNodesHtml.forEach(prodNode => document.getElementById("bls__blog-articles").appendChild(prodNode));
                    const load_more = productNodes.querySelector('.collections-load-more');
                    document.querySelector(".load-more-amount").innerHTML = productNodes.querySelector('.load-more-amount').textContent;
                    document.querySelector(".load-more-percent").style.width = productNodes.querySelector('.load-more-percent').style.width;
                    if ( load_more ) {
                        target.setAttribute("href", load_more.getAttribute('href'));
                    } else {
                        target.remove();
                    }
                    this.toggleLoading(target, false);
                    BlsLazyloadImg.init();
                    BlsPortfolioPage.init();
                })
                .catch((error) => {
                    throw error;
            });
        },

        toggleLoading: function(event, loading) {
            if (event) {
                const method = loading ? 'add' : 'remove';
                event.classList[method]('loading');
            }
        }
    }
})();

BlsEventBlogShopify.init();
var BlsPortfolioPage = (function () {
    return {
      init: function () {
        this.renderLayout();
      },
      renderLayout: function () {
        const portfolio = document.querySelector(".bls__blog-articles-portfolio");
        if (portfolio) {
          new Masonry(portfolio);
        }
      },
    };
  })();
  BlsPortfolioPage.init();

  document.addEventListener("shopify:section:load", function (event) {
    var id = event.detail.sectionId;
    var section = event.target.querySelector("[" + "data-id" + '="' + id + '"]');
    if (section) {
      var portfolio = section.querySelector(".bls__blog-articles-portfolio");
      if (portfolio) {
        BlsPortfolioPage.init();
      }
    }
  });
