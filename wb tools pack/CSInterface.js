function CSInterface() {
  this._eventHandlers = {};
  this._id = Date.now() + '_' + Math.random();
}

CSInterface.prototype.evalScript = function(script, callback) {
  var self = this;
  try {
    if (typeof __adobe_cep__ !== 'undefined' && __adobe_cep__.evalScript) {
      __adobe_cep__.evalScript(script, function(result) {
        if (callback) callback(result);
      });
    } else {
      if (callback) callback('');
    }
  } catch(e) {
    if (callback) callback('');
  }
};

CSInterface.prototype.addEventListener = function(type, handler) {
  if (!this._eventHandlers[type]) {
    this._eventHandlers[type] = [];
  }
  this._eventHandlers[type].push(handler);
};

CSInterface.prototype.dispatchEvent = function(event) {
  var handlers = this._eventHandlers[event.type];
  if (handlers) {
    for (var i = 0; i < handlers.length; i++) {
      try { handlers[i](event); } catch(e) {}
    }
  }
};

CSInterface.prototype.getExtensionID = function() {
  try {
    if (typeof __adobe_cep__ !== 'undefined' && __adobe_cep__.getExtensionID) {
      return __adobe_cep__.getExtensionID();
    }
  } catch(e) {}
  return 'com.aefxmanager.wbtools';
};

CSInterface.prototype.getHostEnvironment = function() {
  try {
    if (typeof __adobe_cep__ !== 'undefined' && __adobe_cep__.getHostEnvironment) {
      return JSON.parse(__adobe_cep__.getHostEnvironment());
    }
  } catch(e) {}
  return null;
};

CSInterface.prototype.registerKeyEventsInterest = function(keyEventsInterest) {
  try {
    if (typeof __adobe_cep__ !== 'undefined' && __adobe_cep__.registerKeyEventsInterest) {
      __adobe_cep__.registerKeyEventsInterest(JSON.stringify(keyEventsInterest));
    }
  } catch(e) {}
};
