sap.ui.define([
    "mortgage/pawnshop/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "mortgage/pawnshop/model/formatter",
    "sap/m/BusyDialog",
    "mortgage/pawnshop/model/models"
], function (BaseController, MessageToast, JSONModel, Filter, formatter, BusyDialog, models) {
    "use strict";

    return BaseController.extend("mortgage.pawnshop.controller.CateConfig", {
        formatter: formatter,
        onInit: function () {

            this.getRouter().getRoute("cateConfig").attachPatternMatched(this._onObjectMatched, this);

        },
        _onObjectMatched: function (arg) {
            // console.log(transModel);
            this.bindCateConfigModel();
        },
        bindCateConfigModel: function () {
            var shopId = this.getModel("account").getProperty("/shop/id");
            var model = this.getModel("cateConfig");
            if (!model) {
                model = new JSONModel();
                this.getOwnerComponent().setModel(model, "cateConfig");
            }
            var data = models.getCateConfigSet(shopId);
            model.setProperty("/", data);
        },
        onChangeStatusCateConfig: function () {
            var currentConfigModel = this.shopConfigDialog.getModel("currentConfig");
            var data = currentConfigModel.getProperty("/");
            var sendData = {
                cateConfigId: data.id,
                status: data.status === 1 ? 2 : 1
            };
            var result = models.changeStatusCateConfig(sendData);
            if (result) {
                this.bindCateConfigModel();
                this.shopConfigDialog.close();
            }
        },
        onFilterByStatus: function (e) {
            var selectedItems = e.getParameter("selectedItems");
            if (!selectedItems) {
                return;
            }
            var filters = [];
            for (var i = 0; i < selectedItems.length; i++) {
                var filter = new Filter({
                    path: "status",
                    operator: "EQ",
                    value1: selectedItems[i].getKey()
                });
                filters.push(filter);
            }
            var table = this.byId("tblCateConfig");
            var bindingInfo = table.getBinding("items");
            if (bindingInfo) {
                bindingInfo.filter(filters);
            }
        },
        onCreateConfigPressed: function () {
            if (!this.shopConfigDialog) {
                this.shopConfigDialog = this.initFragment("mortgage.pawnshop.fragment.ShopConfigDialog", "currentConfig");
            }
            // set mode = create
            this.shopConfigDialog.getModel("currentConfig").setProperty("/", {}, null, false);
            this.shopConfigDialog.getModel("currentConfig").setProperty("/isUpdate", false, null, false);
            this.shopConfigDialog.open();
        },
        onDetailConfigPressed: function (e) {
            //get detail Config data
            var data = e.getSource().getBindingContext("cateConfig").getProperty("");
            if (!this.shopConfigDialog) {
                this.shopConfigDialog = this.initFragment("mortgage.pawnshop.fragment.ShopConfigDialog", "currentConfig");
            }
            var currentConfigModel = this.shopConfigDialog.getModel("currentConfig");
            if (!currentConfigModel) {
                var msg = this.getResourceBundle().getText("msgFailToInitDialog");
                MessageToast.show(msg);
                return;
            }
            //set data for detailConfigDialog
            currentConfigModel.setProperty("/", data, null, false);
            currentConfigModel.setProperty("/cateId", data.category.id, null, false);
            // set mode = update
            currentConfigModel.setProperty("/isUpdate", true, null, false);
            this.shopConfigDialog.open();
        },
        onSubmitCateConfig: function () {
            //get shopId
            var accountModel = this.getModel("account");
            if (!accountModel) {
                this.getRouter().navTo("login", true);
                return;
            }
            var shopId = accountModel.getProperty("/shop/id");
            //get data of editing cate config
            var currentConfigModel = this.shopConfigDialog.getModel("currentConfig");
            var data = currentConfigModel.getProperty("/");
            data.shopId = shopId;
            data.categoryId = parseInt(data.cateId);
            data.cateConfigId = parseInt(data.id);
            if (data.value1) {
                data.attributes = data.value1;
            }
            if (data.value2) {
                data.attributes = data.attributes + "," + data.value2;
            }
            if (data.value3) {
                data.attributes = data.attributes + "," + data.value3;
            }
            if (data.value4) {
                data.attributes = data.attributes + "," + data.value4;
            }
            var updateResult = false;
            // submit changes
            if (data.isUpdate) {
                updateResult = models.updateCateConfigSet(data);
            } else {
                updateResult = models.postCateConfigSet(data);
            }
            if (updateResult) {
                var msg = this.getResourceBundle().getText("msgSavedChanges");
                MessageToast.show(msg);
                //refresh CateConfig View
                this.bindCateConfigModel();
                this.shopConfigDialog.close();
            } else {
                //handle error here
                var msg = this.getResourceBundle().getText("msgErrorSavingConfig");
                MessageToast.show(msg);
            }
        }
    });
});