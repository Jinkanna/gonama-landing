"use strict";

var BlsPasswordPopup = (function () {
    return {
      init: function () {
        this.showPassword();
      },
      showPassword: function () {
        const action = document.querySelector("#DialogHeading");
        const _this = this;
        if (action !== null) {
          action.addEventListener("click", (e) => {
            e.preventDefault();
            _this.getContentPassword();
          });
        }
      },
      getContentPassword: function(){
        const content = document.querySelector('.password-modal__content').innerHTML;
        const title = document.querySelector('.content__password').getAttribute('data-title');
        var password = EasyDialogBox.create(
            "password0",
            "dlg dlg-disable-footer dlg-disable-drag", `${title}`,
            content
          );
          password.onClose = password.destroy;
          password.show();
      }
    };
  })();
  BlsPasswordPopup.init();