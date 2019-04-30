sap.ui.define([
	"mortgage/pawnshop/controller/BaseController",
	"sap/m/MessageToast",
	"mortgage/pawnshop/model/models"
], function(BaseController, MessageToast, models) {
	"use strict";
	return BaseController.extend("mortgage.pawnshop.controller.LoginView", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf mortgage.pawnshop.view.LoginView
		 */
		onInit: function() {
			// this.logon = this.login();
			var text = this.getResourceBundle().getText("txtLoginWaitingText");
			var title = this.getResourceBundle().getText("txtLoginWaitingTitle");
			this.busyDialog = new sap.m.BusyDialog({
				text: text,
				title: title
			});
			// this.getRouter().getRoute("login").attachPatternMatched(this.onAfterRendering, this);
			this.txtUsername = this.getView().byId("_txtUsername");
			this.txtPassword = this.getView().byId("_txtPassword");
			// this.txtPassword.setValue("");
		},
		doAutoLogin: function() {
			var loginInfo = this.getSavedLoginData();
			var logon = this.login(loginInfo.username, loginInfo.password);
			if (logon) {
				var authorized = this.checkAuthorization();
				if (authorized) {
					this.getRouter().navTo("listShop", {
						userName: loginInfo.username
					}, true);
				}
			} else {
				this.getView().setBusy(false);
				this.txtPassword.setValue("");
			}
			this.busyDialog.close();
			return logon;
		},
		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf mortgage.pawnshop.view.LoginView
		 */
		onLoginPressed: function(e) {
			this.busyDialog.open();
			var verified = this.verifyUser();
			var authorized = false;
			if (verified) {
				var username = this.txtUsername.getValue();
				var password = this.txtPassword.getValue();
				var result = this.login(username, password);
				if (result) {
					//check authorization
					authorized = this.checkAuthorization();
					if (authorized) {
						this.getRouter().navTo("listShop", {
							userName: username
						}, true);
					}
				} else {
					var msg;
					msg = this.getResourceBundle().getText("msgWrongPass");
					this.txtPassword.setValueState("Error");
					this.txtPassword.setValueStateText(msg);
				}
			} else {
				if (this.txtUsername.getValueState() === "Error") {
					MessageToast.show(this.txtUsername.getValueStateText());
				}
				if (this.txtPassword.getValueState() === "Error") {
					MessageToast.show(this.txtPassword.getValueStateText());
				}
			}
			this.busyDialog.close();
		},

		checkAuthorization: function() {
			var oModelAccount = this.getModel("account");
			var role = oModelAccount.getProperty("/user/role");
			if (role.id === 3) { // 2: ROLE_PAWNSHOP
				return true;
			} else {
				MessageToast.show(this.getResourceBundle().getText("msgNotAuthenticated"));
			}
		},

		verifyUser: function() {
			return this.validateUsername() && this.validatePassword();
		},

		validateUsername: function(oEvent) {
			var source = oEvent ? oEvent.getSource() : this.txtUsername;
			var value = source.getValue();
			var regex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
			// if (value && value !== "" && regex.test(value)) {
			if (value && value !== "") {
				source.setValueState("None");
				return true;
			} else {
				source.setValueState("Error");
				var msg = this.getResourceBundle().getText("msgWrongEmailFormat");
				source.setValueStateText(msg);
				return false;
			}
		},
		validatePassword: function(oEvent) {
			var source = oEvent ? oEvent.getSource() : this.txtPassword;
			var value = source.getValue();
			if (value && value !== "") {
				source.setValueState("None");
				return true;
			} else {
				source.setValueState("Error");
				var msg = this.getResourceBundle().getText("msgWrongPass");
				source.setValueStateText(msg);
				return false;
			}
		},
		onBeforeRendering: function() {},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf mortgage.pawnshop.view.LoginView
		 */
		onAfterRendering: function() {
			// this.busyDialog.open();
			this.autologin = this.doAutoLogin();
			this.busyDialog.close();
		},
		getSavedLoginData: function() {
			return {
				username: localStorage.getItem("username"),
				password: localStorage.getItem("password")
			};
		},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf mortgage.pawnshop.view.LoginView
		 */
		onExit: function() {}

	});

});