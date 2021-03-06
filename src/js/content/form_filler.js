/*global FormError, jQuery, JSONF, Logger, Utils*/
/*eslint complexity:0*/
var FormFiller = {
  error: null,
  fill: function(selector, value, beforeData) {
    var domNodes = document.querySelectorAll(selector);
    var domNode = null;
    var fillMethod = null;

    if (domNodes.length === 0) {
      return new FormError(selector, value, "Could not find field");
    }

    var parsedValue = JSONF.parse(value);

    // Call field specific method on EVERY field found
    //
    // "_fill" + the camelized version of one of these:
    // text , button , checkbox , image , password , radio , textarea , select-one , select-multiple , search
    // email , url , tel , number , range , date , month , week , time , datetime , datetime-local , color
    //
    // eg. _fillDatetimeLocal(value)
    var i;
    for (i = 0; i < domNodes.length; ++i) {
      domNode = domNodes[i];
      fillMethod = this._fillMethod(domNode);

      // if the value is a function, call it with the jQuery wrapped domNode
      if(typeof parsedValue === "function") {
        try {
          parsedValue = parsedValue(jQuery(domNode), beforeData);
        } catch (e) {
          Logger.info("[form_filler.js] Got an exception executing value function: " + parsedValue);
          Logger.info("[form_filler.js] Original exception: " + e);
          Logger.info("[form_filler.js] Original stack: " + e.stack);
          return new FormError(selector, value, "Error while executing value-function: " + JSONF.stringify(e.message));
        }
      }

      // Fill field only if value is not null or not defined
      if(parsedValue !== null && typeof parsedValue !== "undefined") {
        // Fill field using the specialized method or default
        return fillMethod(domNode, parsedValue, selector) || null;
      }
    }

  },
  _fillDefault: function(domNode, value) {
    domNode.value = value;
  },
  _fillCheckbox: function(domNode, value) {
    domNode.checked = (domNode.value == value);
  },
  _fillRadio: function(domNode, value) {
    domNode.checked = (domNode.value === value);
  },
  _fillSelectOne: function(domNode, value) {
    var i = 0;
    var optionNode = null;
    for(i = 0; i < domNode.children.length; i++) {
      optionNode = domNode.children[i];
      if(optionNode.value === value) {
        optionNode.selected = value;
        return;
      }
    }
  },
  _fillSelectMultiple: function(domNode, value) {
    var i = 0;
    var optionNode = null;
    var someFunction = function(targetValue) {
      return optionNode.value === targetValue;
    };
    value = Array.isArray(value) ? value : [value];

    for(i = 0; i < domNode.children.length; i++) {
      optionNode = domNode.children[i];
      optionNode.selected = value.some(someFunction);
    }
  },
  _fillDate: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'date' field cannot be filled with this. See http://bit.ly/formofill-formats");
    }
  },
  _fillMonth: function(domNode, value, selector) {
    if(/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'month' field cannot be filled with this value. See http://bit.ly/formofill-format-month");
    }
  },
  _fillWeek: function(domNode, value, selector) {
    if(/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0123])$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'week' field cannot be filled with tihs value. See http://bit.ly/formofill-format-week");
    }
  },
  _fillTime: function(domNode, value, selector) {
    if(/^(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)(\.(\d{1,3}))?$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'time' field cannot be filled with this value. See http://bit.ly/formofill-format-time");
    }
  },
  _fillDatetime: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}T(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)([T|Z][^\d]|[+-][01][0-4]:\d\d)$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'datetime' field cannot be filled with this value. See http://bit.ly/formofill-format-date-time");
    }
  },
  _fillDatetimeLocal: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}T(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)(\.(\d{1,3}))?$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'datetime-local' field cannot be filled with this value. See http://bit.ly/formofill-format-date-time-local");
    }
  },
  _fillColor: function(domNode, value, selector) {
    if(/^#[0-9a-f]{6}$/i.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'color' field cannot be filled with this value. See http://bit.ly/formofill-format-color");
    }
  },
  _typeMethod: function(type) {
    return ("_fill-" + type).replace(/(\-[a-z])/g, function($1) {
      return $1.toUpperCase().replace('-','');
    });
  },
  _fillMethod: function(domNode) {
    var fillMethod = this[this._typeMethod(domNode.type)];
    // Default is to set the value of the field if
    // no special function is defined for that type
    if (typeof fillMethod !== "function") {
      fillMethod = this._fillDefault;
    }
    return fillMethod;
  }
};

