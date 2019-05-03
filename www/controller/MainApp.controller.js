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

	return BaseController.extend("mortgage.pawnshop.controller.MainApp", {
		formatter: formatter,
		onInit: function() {
			this.busyDialog = new BusyDialog();
			this.submitAddress = [];
			this.City = "";
			this.District = "";
			this.Ward = "";
			this.inpSearch = this.byId("inpSearch");
			this.sideNavigation = this.byId("sideNavigation");
			this.page = this.byId("_pageCustomer");
			this.headerTitle = this.byId("_titleMain");
			this.headerIcon = this.byId("_iconMain");
			this.logon = this.login();
			var text = "";
			var title = "";
			var cancel = "";
			//Change password dialog initialization
			if (!this.changePassDialog) {
				this.changePassDialog = sap.ui.xmlfragment(this.getView().getId(), "mortgage.pawnshop.fragment.ChangePassDialog", this);
				this.getView().addDependent(this.changePassDialog);
				this.txtOldPass = this.byId("_txtOldPass");
				this.txtNewPass = this.byId("_txtNewPass");
				this.txtConfirmNewPass = this.byId("_txtConfirmNewPass");
			}
			// Change address dialog initialization
			// if (!this.AddressDialog) {
			//     this.AddressDialog = new sap.ui.xmlfragment(this.getView().getId(), "mortgage.pawnshop.fragment.Address", this);
			//     this.getView().addDependent(this.AddressDialog);
			//     this._selectCity = this.byId("_selectCity");
			//     this._selectDistrict = this.byId("_selectDistrict");
			//     this._selectWard = this.byId("_selectWard");
			// }
			//Attachment matched
			this.getRouter().getRoute("dashboard").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function() {
			this.bindCateConfigModel();
			setInterval(this.getNotify(), 10000);
		},
		bindCateConfigModel: function() {
			var accountModel = this.getModel("account");
			if (!accountModel) {
				this.getRouter().navTo("login", true);
				return;
			}
			var shopId = accountModel.getProperty("/shop/id");
			var cateConfigModel = this.getModel("cateConfig");
			if (!cateConfigModel) {
				cateConfigModel = new JSONModel();
				this.getOwnerComponent().setModel(cateConfigModel, "cateConfig");
			}
			var data = models.getCateConfigSet(shopId);
			cateConfigModel.setProperty("/", data);
		},

		// onDialogClosed: function (oEvent) {
		//     var busy
		//     // jQuery.sap.clearDelayedCall(_timeout);
		//
		//     // if (oEvent.getParameter("cancelPressed")) {
		//     //     MessageToast.show("The operation has been cancelled");
		//     // } else {
		//     //     MessageToast.show("The operation has been completed");
		//     // }
		// },

		forceChangePass: function() {
			this.changePasswordPress();
		},
		changePasswordPress: function() {
			this.changePassDialog.open();
		},
		onBeforeRendering: function() {
			if (!this.checkLogin()) {
				this.getRouter().navTo("login", true);
			}
		},
		onAfterRendering: function() {
			if (!this.checkLogin()) {
				this.getRouter().navTo("login", true);
			}
			
		},

		getNotify: function() {
			var notiModel = this.getModel("noti");
			if (!notiModel) {
				notiModel = new JSONModel();
				this.setModel(notiModel, "noti");
			}
			var accountModel = this.getModel("account");
			if (!accountModel) {
				//re-login if account data is empty. #Security-mechanism
				this.logout();
				return;
			}
			var accountId = accountModel.getProperty("/user/id");
			var notifications = models.getNotifications(accountId) || [];
			//filter type 3 & 4
			var validNoti = [];
			for (var i = 0; i < notifications.length; i++) {
				if (notifications[i].type === 3 || notifications[i].type === 4) {
					validNoti.push(notifications[i]);
				}
			}
			notiModel.setProperty("/", validNoti);
		},

		doNav: function(view, source) {
			this.getRouter().navTo(view, true);
			this.page.setSideExpanded(false);
			var icon = source.getIcon();

			var text = source.getText();
			this.getGlobalModel().setProperty("/appTitle", text);
			this.getGlobalModel().setProperty("/appTitleIcon", icon);
			this.headerTitle.getText(text);
		},
		navToTransaction: function(oEvent) {
			var source = oEvent.getSource();
			this.doNav("transaction", source);
		},
		navToListShop: function() {
			var oModelAccont = this.getModel("account");
			var username = oModelAccont.getProperty("/user/username");
			this.getRouter().navTo("listShop", {
				userName: username
			});
		},
		navToDashboard: function(oEvent) {
			var source = oEvent.getSource();
			this.doNav("dashboard", source);
		},
		navCateConfig: function(oEvent) {
			var source = oEvent.getSource();
			this.doNav("cateConfig", source);
		},
		navShopConfig: function(oEvent) {
			var source = oEvent.getSource();
			this.doNav("shopConfig", source);
		},
		navSales: function(oEvent) {
			var source = oEvent.getSource();
			this.doNav("sales", source);
		},
		navSaleOrder: function(oEvent) {
			var source = oEvent.getSource();
			this.doNav("OrderList", source);
		},
		navToRegisterPawnShop: function(oEvent) {
			var source = oEvent.getSource();
			this.doNav("RegisterPawnShop", source);
		},
		__cancel: function() {
			var status = this.getGlobalModel().getProperty("/status");
			if (status === "N") {
				this.logout();
			}
			this.changePassDialog.close();
		},
		onSendNoti: function() {
			models.demoSendNoti();
		},
		navToArtTypeItems: function(oEvent) {
			var articleType = oEvent.getSource().getBindingContext().getProperty("Mtart");
			this.page.setSideExpanded(false);
			this.getRouter().navTo("proList", {
				Mtart: articleType
			}, false);
		},
		__submitChangePassword: function() {
			var msg = "";
			// validate oldPas
			var oldPass = this.txtOldPass.getValue();
			var logonPass = this.getGlobalModel().getProperty("/token");
			if (oldPass !== logonPass) {
				msg = this.getResourceBundle().getText("msgOldPassValidateFailed");
				MessageToast.show(msg);
			} else {
				if (this.txtNewPass.getValue() !== this.txtConfirmNewPass.getValue() ||
					this.txtNewPass.getValue() === "" ||
					this.txtConfirmNewPass.getValue() === "") {
					msg = this.getResourceBundle().getText("msgNewPassValidateFailed");
					MessageToast.show(msg);
				} else {
					this.doChangePass();
				}
			}
		},
		onMessagePopoverPress: function(oEvent) {
			var notiList = this.byId("notiList");
			// this.bindNotiModel();
			notiList.openBy(oEvent.getSource());
		},
		doChangePass: function() {
			var that = this;
			var onSuccess = function(data) {
					if (data.returnValue === "X") {
						var msg = that.getResourceBundle().getText("msgChangePassSuccess");
						that.getGlobalModel().setProperty("/status", 'A', null, true);
						MessageToast.show(msg);
						that.changePassDialog.close();
					} else {
						var msg = that.getResourceBundle().getText("msgChangePassFailed");
						MessageToast.show(msg);
					}
				},
				onError = function(error) {
					var msg = that.getResourceBundle().getText("msgChangePassFailed");
					MessageToast.show(msg);
				};
			var parameters = {
				Pernr: this.Pernr,
				oldPassword: this.txtOldPass.getValue(),
				newPassword: this.txtNewPass.getValue()
			};
			this.getModel().callFunction("/ChangePassword", {
				method: "POST",
				urlParameters: parameters,
				success: onSuccess,
				error: onError
			});
		},

		showMenu: function() {
			var expanded = this.page.getSideExpanded();
			this.page.setSideExpanded(!expanded);
		},

		__toViewCart: function() {
			this.getRouter().navTo("cart", false);
		},
		//On selected value from suggested list
		onSearch: function(oEvent) {
			var item = oEvent.getParameter("suggestionItem");
			if (item) {
				var Matnr = oEvent.getParameter("suggestionItem").getKey();
				if (Matnr) {
					this.getRouter().navTo("productDetail", {
						"Matnr": Matnr
					}, false);
				}
			}
			this.openBusyDialog({
				title: "Loading...",
				showCancelButton: true
			});
		},
		onSuggest: function(oEvent) {
			var value = oEvent.getParameter("suggestValue");
			var filters = [];
			var maktgFilter = new Filter({
				path: "Maktg",
				operator: sap.ui.model.FilterOperator.StartsWith,
				value1: value
			});
			filters.push(maktgFilter);
			this.inpSearch.getBinding("suggestionItems").attachDataReceived(this.inpSearch.suggest(), this);
			this.inpSearch.getBinding("suggestionItems").filter(filters);
		},

		onPressNotiDetail: function(oEvent) {
				var item = oEvent.getSource();
				var bindingContext = item.getBindingContext("noti");
				if (bindingContext) {
					var type = bindingContext.getProperty("type");
					if (type === 3) {
						this.getRouter().navTo("transaction");
					}
				}
			}
			//Open dialog add customer address
			// _openAddressDialog: function () {
			//     this.AddressDialog.open();
			// },
			// __addAddrCancel: function () {
			//     this.AddressDialog.close();
			// },
			// onCityChange: function (oEvent) {
			//     var that = this;
			//     var selectedItem = oEvent.getSource().getSelectedItem();
			//     if (selectedItem) {
			//         var selCityKey = selectedItem.getBindingContext().getProperty("Ztinh");
			//         if (selCityKey) {
			//             this.sPath = this.getModel().createKey("/CitySet", {
			//                 Ztinh: selCityKey
			//             });
			//             console.log(this._selectDistrict);
			//             this._selectDistrict.bindElement({
			//                 path: this.sPath
			//             });
			//             // this._selectDistrict.getBinding("items").refresh();
			//         }
			//     }
			// },
			// onDistrictChange: function (oEvent) {
			//     var selectedItem = oEvent.getSource().getSelectedItem();
			//     if (selectedItem) {
			//         var selCityKey = selectedItem.getBindingContext().getProperty("Ztinh");
			//         var selDistrictKey = selectedItem.getBindingContext().getProperty("Zquan");
			//
			//         this.City = selCityKey;
			//         this.District = selDistrictKey;
			//
			//         if (selDistrictKey && selCityKey) {
			//             this.sPath = this.getModel().createKey("/DistrictSet", {
			//                 Ztinh: selCityKey,
			//                 Zquan: selDistrictKey
			//             });
			//             console.log(this.submitAddress);
			//             this._selectWard.bindElement({
			//                 path: this.sPath
			//             });
			//         }navToHome
			//     }
			// },
			// onWardChange: function (oEvent) {
			//     var selWardsKey = oEvent.getSource().getSelectedItem().getBindingContext().getProperty("Zphuong");
			//     this.submitAddress.push(this.City, this.District, selWardsKey);
			//     console.log(this.submitAddress);
			// },
			// //Adđ customer place
			// onAddressPick: function () {
			//     alert("licked");
			// }
	});
});