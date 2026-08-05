var BlsCustomer = (function(){
    return {
      init : function(){
        this.toggleForm(),
        this.deleteAddresses(),
        this.addAddresses()
      },
      toggleForm: function(){
        const e = document.querySelector('.add-address');
        const c = document.querySelector('.cancel-add');
        if (e !== null && c !== null) {
          e.addEventListener('click',()=>{
            if (e.getAttribute('aria-expanded') === 'false') {
              e.setAttribute('aria-expanded', 'true');
              e.closest('.bls-customer__address').classList.add('active');
            } else {
              e.setAttribute('aria-expanded', 'false');
              e.closest('.bls-customer__address').classList.remove('active');
            }
          });
          c.addEventListener('click', () => {
            if (c.closest('.bls-customer__address').classList.contains('active')) {
              e.closest('.bls-customer__address').classList.remove('active');
              e.closest('.add-address').setAttribute('aria-expanded', 'false');
            }
          })
        }
      },
      deleteAddresses: function(){
        const btn = document.querySelectorAll('.address-delete');
        btn.forEach(e => {
          e.addEventListener('click', () =>{
            const id = e?.dataset.formId;
            const msg = e?.dataset.confirmMessage;
            if (confirm(msg || 'Are you sure you wish to delete this address?')) {
              Shopify.postLink('/account/addresses/' + id, {parameters: {_method: 'delete'}});
            }
          })
        })
      },
      addAddresses: function(){
        if (Shopify) {
          new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
            hideElement: 'AddressProvinceNewContainer'
          });
        }
        const edit = document.querySelectorAll('.edit-country-option');
        edit.forEach(e=>{
          const formId = e?.dataset.formId;
          const editCountry = 'AddressCountry_' + formId;
          const editProvince = 'AddressProvince_' + formId;
          const editContainer = 'AddressProvinceContainer_' + formId; 
          new Shopify.CountryProvinceSelector(editCountry, editProvince, {
            hideElement: editContainer
          });
        })
      }
    }
  })();
  BlsCustomer.init();