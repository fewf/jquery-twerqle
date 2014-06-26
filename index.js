window.Backbone = require('backbone');
window.app = {};
app.twq = require('./script/adaptor');
Backbone.sync = function(method, model, options) {
        if (typeof options == 'function') {
            options = {
                success: options,
                error: function(msg) { console.log(msg); }
            };
        }

        var resp;

        switch (method) {
            case "read":    resp = typeof this.read === 'function' ? this.read(model) : app.twq.read.apply(this, arguments);        break;
            case "create":  resp = this.create(model);      break;
            case "update":  resp = this.update(model);      break;
            case "delete":  resp = this.destroy(model);     break;
        }

        if (resp) {
            options.success(resp);
        } else {
            options.error('Record not found.');
        }
    };

var AppView = require('./views/app-view');

app.appView = new AppView();