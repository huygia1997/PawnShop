sap.ui.define([
    "mortgage/pawnshop/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "mortgage/pawnshop/model/models",
], function (BaseController, JSONModel, models) {
    "use strict";

    return BaseController.extend("mortgage.pawnshop.controller.Dashboard", {
        onInit: function () {
            this.getRouter().getRoute("dashboard").attachMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function () {
            var logon = this.checkLogin();
            if (!logon) {
                this.getRouter().navTo("login", true);
                return;
            }
            this.loadDashboardModel();

        },
        loadDashboardModel: function () {
            var accountModel = this.getModel("account");
            if (!accountModel) {
                this.getRouter().navTo("login", true);
                return;
            }
            var shopId = accountModel.getProperty("/shop/id");
            var dashboardModel = this.getModel("dashboard");
            if (!dashboardModel) {
                dashboardModel = new JSONModel();
                this.setModel(dashboardModel, "dashboard");
            }
            var dashboardData = models.getDashboard(shopId);
            dashboardModel.setProperty("/", dashboardData);
        }
    });

});