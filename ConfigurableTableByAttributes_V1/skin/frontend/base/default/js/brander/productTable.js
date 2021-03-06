ProductTable = Class.create();
ProductTable.prototype = {
    initialize: function(config){
        this.config        = config;
        this.inputQty      = 'input-qty';
        this.maxTdQty      = 9;
        this.taxConfig     = this.config.taxConfig;
        this.qtyElement    = 0;
        this.childClass    ='child-table-row';
        this.generalClass  = 'general-table-row';
        this.productValues = 'product-values';
        if (config.containerId) {
            this.settings   = $$('#' + config.containerId + ' ' + '.super-attribute-table');
        } else {
            this.settings   = $$('.super-attribute-table');
        }
        this.state      = new Hash();

        // Set default values from config
        if (config.defaultValues) {
            this.values = config.defaultValues;
        }

        // Overwrite defaults by url
        var separatorIndex = window.location.href.indexOf('#');
        if (separatorIndex != -1) {
            var paramsStr = window.location.href.substr(separatorIndex+1);
            var urlValues = paramsStr.toQueryParams();
            if (!this.values) {
                this.values = {};
            }
            for (var i in urlValues) {
                this.values[i] = urlValues[i];
            }
        }

        // Overwrite defaults by inputs values if needed
        if (config.inputsInitialized) {
            this.values = {};
            this.settings.each(function(element) {
                if (element.value) {
                    var attributeId = element.id.replace(/[a-z]*/, '');
                    this.values[attributeId] = element.value;
                }
            }.bind(this));
        }

        // Put events to check select reloads
        this.settings.each(function(element){
            Event.observe(element, 'change', this.configure.bind(this));
        }.bind(this));

        // fill state
        this.settings.each(function(element){
            var attributeId = element.id.replace(/[a-z]*/, '');
            if(attributeId && this.config.attributes[attributeId]) {
                element.config = this.config.attributes[attributeId];
                element.attributeId = attributeId;
                this.state[attributeId] = false;
            }
        }.bind(this));

        // Init settings dropdown
        var childSettings = [];
        for(var i=this.settings.length-1;i>=0;i--){
            var prevSetting = this.settings[i-1] ? this.settings[i-1] : false;
            var nextSetting = this.settings[i+1] ? this.settings[i+1] : false;
            var сlassName = '';
            if(i === 0) {
                сlassName = this.generalClass;
            } else {
                сlassName = this.childClass;
            }

            this.fillTable(this.settings[i], сlassName);

            $(this.settings[i]).childSettings = childSettings.clone();
            $(this.settings[i]).prevSetting   = prevSetting;
            $(this.settings[i]).nextSetting   = nextSetting;
            childSettings.push(this.settings[i]);
        }

        for(key in config.attributes) {
            if(config.attributes[key].options.length > this.qtyElement) {
                this.qtyElement = config.attributes[key].options.length;
            }
        }

        this.fillTableInputQty(this.qtyElement);
    },

    configure: function(event){
        var element = Event.element(event);
        this.configureElement(element);
    },

    fillTableInputQty: function(qty) {
        var table = document.querySelectorAll('[data-id="super-attribute-table"]');
        table = table[0];
        qty = qty-1;

        var tr = this._generateTrTableQty(qty);

        table.appendChild(tr);
    },

    _generateTrTableQty: function (qty) {
        var tr = document.createElement('tr');

        qty = (qty <= this.maxTdQty) ? qty : this.maxTdQty;

        for(var i = 0; i <= qty; i++) {
            var td = document.createElement('td');
            var div = this._createDivQty();
            var input = this._createInputQty(i);

            var _self = this;
            Event.observe(input, 'change', function(event) {
                _self.qtyItemSet(event, _self);
            });

            div.appendChild(input);
            td.appendChild(div);
            tr.appendChild(td);
        }

        return tr;
    },

    _createDivQty: function() {
        var div = document.createElement('div');

        div.classList.add('qty-wrapper');

        return div;
    },

    _createInputQty: function(i) {
        var input = document.createElement('input');
        input.type = 'number';
        input.pattern = 'pattern="\d*(\.\d+)?"';
        input.dataset.id = 'qty-' + i;
        input.dataset.class = this.inputQty;
        input.setAttribute('maxlength', '12');
        input.setAttribute('step', '1');
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('value', '0');
        input.setAttribute('min', '0');
        input.classList.add('input-text');
        input.classList.add('qty');

        return input;
    },

    qtyItemSet: function(el, object){
        var specialAttr = document.querySelectorAll('.general-table-row.active');
        var child = document.querySelectorAll('.child-table-row.active');

        var childId = null;
        if(child.length > 0) {
            childId = child[0].id;
        }

        var productId = object.getProductId(object, specialAttr[0].id, childId);
        var inputQtyValue = document.querySelectorAll('[name="' + productId[0] + '-' + el.srcElement.dataset.id +'"]');

        if(inputQtyValue.length < 1) {
            inputQtyValue = document.createElement('input');
            inputQtyValue.name = productId[0] + '-' + el.srcElement.dataset.id;
            inputQtyValue.type = 'hidden';
            inputQtyValue.value = el.srcElement.value;

            var productDiv = document.querySelectorAll('[data-id="product-values"]');
            productDiv[0].appendChild(inputQtyValue);
        } else {
            inputQtyValue[0].value = el.srcElement.value;
        }
    },

    fillTable: function(element, generalClass) {
        var attributeId = element.id.replace(/[a-z]*/, '');
        var options = this.getAttributeOptions(attributeId);

        if(options) {
            var index = 1;
            var optionsLength = (options.length <= 9) ? options.length : 9;//TODO
            for(var i=0; i < optionsLength; i++){
                var td = document.createElement('td');
                td.id = options[i].id;
                td.dataset.id = 'qty-' + i;
                if(generalClass.length > 0) {
                    td.classList.add(generalClass);
                }
                td.innerHTML = options[i].label;

                var _self = this;

                Event.observe(td, 'click', function(event){
                    _self.clickItem(event, _self)
                });

                var allowedProducts = [];

                allowedProducts = options[i].products.clone();

                if(allowedProducts.size() > 0 ){
                    options[i].allowedProducts = allowedProducts;
                    if (typeof options[i].price != 'undefined') {
                        td.setAttribute('price', options[i].price);
                    }
                    index++;
                }
                element.appendChild(td);
            }
        }
    },

    clickItem: function(element, object) {
        var el = element;
        element.toElement.classList.forEach(function(item, i ,arr){
            if(item === object.generalClass && arr.value.indexOf('active') < 0) {
                var elements = document.getElementsByClassName(object.generalClass);
                for(var i = elements.length-1; i >= 0; i--) {
                    object._removeClassElement(elements[i], 'active');
                }

                var selector = '[data-class="' + object.inputQty + '"]';
                object._setAttributeReadOnly(selector);

                var childElements = object._getElementChildRow(object.childClass);
                el.toElement.classList.add('active');

                if(childElements.length < 1) {
                    object._addProductByOneAttribute(object, el, '[data-id="' + object.productValues + '"]');
                } else {
                    object._addProductByAttributes(object, el, childElements);
                }
                return;
            } else if(arr.value.indexOf(object.childClass) >= 0 && arr.value.indexOf('active') < 0) {

                var elements = object._getElementChildRow(object.childClass);

                for(var i = elements.length-1; i >= 0; i--) {
                    object._removeClassElement(elements[i], 'active');
                }

                var specialAttr = document.querySelectorAll('.' + object.generalClass + '.active');

                if(specialAttr.length > 0) {
                    object._addProductByChildAttribute(object, el, specialAttr[0], '[data-id="product-values"]');
                }
                return;
            }
        });
    },

    _addProductByAttributes: function(object, el, childElements) {
        for (var i = childElements.length - 1; i >= 0; i--) {
            var productId = object.getProductId(object, el.toElement.id, childElements[i].id);
            childElements[i].classList.remove('disabled');

            if(productId.length < 1) {
                childElements[i].classList.add('disabled');
            }
            object._removeClassElement(childElements[i], 'active');
        }
    },

    _addProductByChildAttribute: function (object, el, specialAttr, divSelector) {

        var inputQty = document.querySelectorAll('input[data-id=' + specialAttr.dataset.id + ']');
        var productId = object.getProductId(object, specialAttr.id, el.toElement.id);
        var selector = '[data-class="' + object.inputQty + '"]';

        el.toElement.classList.add('active');

        object._setAttributeReadOnly(selector);

        if(productId.length > 0) {
            inputQty = inputQty[0];
            productId = productId[0];
            var inputQtyValue = document.querySelectorAll('[name="' + productId + '-' + inputQty.dataset.id +'"]');
            inputQty.removeAttribute('readonly');

            inputQty = object._setInputQtyValue(inputQty, inputQtyValue);

            var input = document.querySelectorAll('[name="product-' + productId + '-' + inputQty.dataset.id + '"');
            console.log(specialAttr);
            var data = {
                el:          el.toElement,
                input:       input,
                inputQty:    inputQty,
                productId:   productId,
                specialAttr: specialAttr,
                divSelector: divSelector
            };
            if(input.length < 1) {
                object._addProductInput(data);
            }
        }
    },

    _setInputQtyValue: function(inputQty, inputValue) {
        if(inputValue.length > 0) {
            inputQty.value = inputValue[0];
        } else {
            inputQty.value = 0;
        }

        return inputQty;
    },

    _addProductByOneAttribute: function(object, el, divSelector) {
        var inputQty = document.querySelectorAll('input[data-id='+el.toElement.dataset.id+']');
        var productId = object.getProductId(object, el.toElement.id, el.toElement.id);
        if(productId.length > 0 && inputQty.length > 0) {
            inputQty = inputQty[0];
            productId = productId[0];
            var inputQtyValue = document.querySelectorAll('[name="' + productId + '-' + inputQty.dataset.id +'"]');
            inputQty.removeAttribute('readonly');
            inputQty = object._setInputQtyValue(inputQty, inputQtyValue);

            var input = document.querySelectorAll('[name="product-' + productId + '-' + inputQty.dataset.id + '"');
            if(input.length < 1) {
                var data = {
                    el:          el.toElement,
                    input:       input,
                    inputQty:    inputQty,
                    productId:   productId,
                    divSelector: divSelector
                };
                object._addProductInput(data);
            }

        }

        inputQty.removeAttribute('readonly');
    },

    _addProductInput: function(data) {
        input = document.createElement('input');
        input.name = 'product-' + data.productId + '-' + data.inputQty.dataset.id;
        input.type = 'hidden';
        var value = {};
        var elId = data.el.parentElement.attributeId;
        value[elId] = data.el.id;

        if(data.specialAttr) {
            var specialAttrId = data.specialAttr.parentElement.attributeId;
            value[specialAttrId] = data.specialAttr.id;
        }

        input.value = JSON.stringify(value);

        var productDiv = document.querySelectorAll(data.divSelector);
        productDiv[0].appendChild(input);
    },

    _getElementChildRow: function (selector) {
        return document.getElementsByClassName(selector);
    },

    _setAttributeReadOnly: function(selector) {
        document.querySelectorAll(selector).forEach(function(item){
            item.setAttribute('readonly', 'readonly');
            item.value = 0;
        });
    },

    _removeClassElement: function(element, className){
        element.classList.remove(className);

        return element;
    },

    getProductId: function(object, attr1, attr2) {
        var allProduct = [];
        for (key in object.config.attributes) {
            var options = object.config.attributes[key].options;
            for(var i =  options.length -1; i>=0; i--) {
                if(options[i].id === attr1 || options[i].id === attr2) {
                    allProduct = allProduct.concat(options[i].allowedProducts);
                }
            }
        }

        return object.diff(allProduct);
    },

    diff: function(arr) {
        arrRes = [];
        arr.sort();
        if(arr.length <= 1) {
            return arr;
        }

        for (var i=1; i < arr.length; i++) {
            if (arr[i] == arr[i-1]) {
                arrRes.push(arr[i]);
            }
        }

        return arrRes;
    },

    getAttributeOptions: function(attributeId){
        if(this.config.attributes[attributeId]){
            return this.config.attributes[attributeId].options;
        }
    }
};