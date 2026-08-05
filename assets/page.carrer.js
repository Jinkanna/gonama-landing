"use strict";

var BlsLoadMoreCarrer = (function () {
  return {
    init: function () {
      this.loadMore();
    },
    loadMore: function () {
      const loadPage = document.querySelector(".load-more-page");
      if (loadPage) {
        const main = document.querySelector(".bls-carrer__content");
        var limitItemShow = Number(main.dataset.limit),
          lenghtCa = document.querySelectorAll(".bls-carrer__item").length;
        if (lenghtCa > limitItemShow) {
          const allCareer = document.querySelectorAll(".bls-carrer__item");
          const defaultPercent = document.querySelector(
            ".carrer-action .load-more-percent"
          );
          defaultPercent.style.width =
            (limitItemShow * 100) / allCareer.length + "%";
          var lineCare = Array.from(
            document.querySelectorAll(".bls-carrer__item")
          );
          lineCare.forEach((element, index) => {
            if (index > limitItemShow - 1) {
              const item = lineCare[index];
              if (item.classList.contains("load-carrer")) {
                return;
              }
              item.setAttribute("data-hide", true);
            }
          });
          document
            .querySelector(".load-carrer")
            .addEventListener("click", (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const parent = target.parentElement;
              let itemCarrer = [
                ...parent
                  .closest(".bls-carrer__content")
                  .querySelectorAll(".bls-carrer__item"),
              ];
              for (
                var i = limitItemShow;
                i < limitItemShow + limitItemShow;
                i++
              ) {
                if (itemCarrer[i]) {
                  itemCarrer[i].setAttribute("data-hide", false);
                }
              }
              limitItemShow += limitItemShow;
              const f = [
                ...parent
                  .closest(".bls-carrer__content")
                  .querySelectorAll('.bls-carrer__item[data-hide="false"]'),
              ];
              const contentLimit = parent.querySelector(".limit-carrer");
              contentLimit.innerHTML = f.length;
              const classPercent = parent.querySelector(".load-more-percent");
              var percent;
              percent = (f.length * 100) / itemCarrer.length;
              if (limitItemShow >= lenghtCa) {
                document.querySelector(".load-carrer").style.display = "none";
                percent = 100;
              }
              classPercent.style.width = percent + "%";
            });
        }
      }
    },
  };
})();
BlsLoadMoreCarrer.init();

document.addEventListener("shopify:section:load", function (event) {
  var id = event.detail.sectionId;
  var section = event.target.querySelector("[" + "data-id" + '="' + id + '"]');
  if (section) {
    var carrer = section.querySelector(".bls-carrer__content");
    if (carrer) {
      BlsLoadMoreCarrer.init();
    }
  }
});