function CSInterface() {
    this._cep = window.__adobe_cep__;
    this._callbacks = {};
}

CSInterface.prototype.evalScript = function(script, callback) {
    if (this._cep) {
        this._cep.evalScript(script, callback || function(){});
    } else if (typeof callback === 'function') {
        callback('');
    }
};

CSInterface.prototype.addEventListener = function(type, callback) {
    if (this._cep) {
        this._cep.addEventListener(type, callback);
    }
};

CSInterface.prototype.removeEventListener = function(type, callback) {
    if (this._cep) {
        this._cep.removeEventListener(type, callback);
    }
};

CSInterface.prototype.getExtensions = function(callback) {
    if (this._cep && this._cep.getExtensions) {
        this._cep.getExtensions(callback);
    }
};
