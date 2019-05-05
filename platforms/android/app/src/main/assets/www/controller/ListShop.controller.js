sap.ui.define([
	"mortgage/pawnshop/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"mortgage/pawnshop/model/formatter",
	"sap/m/BusyDialog",
	"mortgage/pawnshop/model/models"
], function(BaseController, MessageToast, JSONModel, Filter, formatter, BusyDialog, models) {
	"use strict";
	var arrShop = [];
	return BaseController.extend("mortgage.pawnshop.controller.ListShop", {
		formatter: formatter,
		onInit: function() {
			this.getRouter().getRoute("listShop").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function() {
			
			this.getList();
		},

		getList: function() {
			arrShop = [];
			var oModelAccount = this.getModel("account");
			var getlistShop = oModelAccount.getProperty("/shopTransDefaults");
			if (getlistShop.length) {
				var oModelList = new JSONModel();
				for (var i = 0; i < getlistShop.length; i++) {
					arrShop.push(getlistShop[i].shop);
				}
				oModelList.setData({
					results: arrShop
				});
				this.setModel(oModelList, "oModelList");
			}
		},

		onSelectShop: function(oEvent) {
			var item = oEvent.getSource();
			var bindingContext = item.getBindingContext("oModelList");
			if (bindingContext) {
				var shopId = bindingContext.getProperty("id");
				for(var i=0; i<arrShop.length;i++) {
					if(shopId === arrShop[i].id) {
						this.getModel("account").setProperty("/shop", arrShop[i]);
					}
				}
				this.getRouter().navTo("dashboard", true);
			}
		}
	});
});