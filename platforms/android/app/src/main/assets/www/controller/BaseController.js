sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    'sap/m/Button',
    'sap/m/MessageToast',
    'sap/m/ResponsivePopover',
    'sap/ui/core/syncStyleClass',
    'sap/m/NotificationListItem',
    'sap/ui/core/CustomData',
    'sap/m/ActionSheet',
    'sap/m/library',
    'sap/m/MessageBox',
    'mortgage/pawnshop/model/models'
], function (Controller, UIComponent, Device, JSONModel, BusyDialog, Button, MessageToast, ResponsivePopover, syncStyleClass,
             NotificationListItem, CustomData, ActionSheet, mobileLibrary, MessageBox, models) {
    "use strict";


    return Controller.extend("mortgage.pawnshop.controller.BaseController", {
        onInit: function () {
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        },
        initFragment: function (sFragName, sModelName) {
            var fragment = sap.ui.xmlfragment(this.getView().getId(), sFragName, this);
            this.getView().addDependent(fragment);
            fragment.setModel(new JSONModel(), sModelName);
            fragment.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            return fragment;
        },
        openBusyDialog: function (oSetting) {
            if (!this.busyDialog) {
                this.busyDialog = new BusyDialog(oSetting);
            } else {
                if (oSetting) {
                    this.busyDialog.setTitle(oSetting.title || "");
                    var busyText = this.getResourceBundle().getText("doing");
                    this.busyDialog.getText(oSetting.text || busyText);
                    this.busyDialog.setShowCancelButton(oSetting.showCancelButton);
                }
            }
            this.busyDialog.open();
        },
        closeBusyDialog: function () {
            if (this.busyDialog) {
                this.busyDialog.close();
            }
        },
        /**
         * Convenience method for getting the control of view by Id.
         * @public
         * @param {string} sId id of the control
         * @returns {sap.m.control} the control
         */
        getId: function () {
            return this.getView().getId();
        },
        byId: function (sId) {
            return this.getView().byId(sId);
        },
        getSId: function (id) {
            return this.getView().getId() + "--" + id;
        },
        /**
         * Convenience method for getting the control of view by Id.
         * @public
         * @param {string} sId id of the control
         * @returns {sap.m.control} the control
         */
        toast: function (sMessage) {
            return MessageToast.show(sMessage);
        },

        back: function () {
            window.history.back();
        },

        getDevice: function () {
            return Device;
        },
        dialogClose: function (oSource) {
            oSource.close();
        },
        /**
         * Convenience method for accessing the router in each controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            // if (sName === null || sName === "") {
            // 	return this.getOwnerComponent().getModel("i18n");
            // }
            return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        createModel: function (sName) {
            var model = new JSONModel();
            this.getView().setModel(model, sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },
        onDialogClose: function (e) {
            e.getSource().getParent().close();
        },
        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resource model of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        /**
         * Convenience method to get the global model containing the global state of the app.
         * @returns {object} the global Propery model
         */
        getGlobalModel: function () {
            return this.getOwnerComponent().getModel("global");
        },
        /**
         * Convenience method to get the global model containing the global state of the app.
         * @returns {object} the global Propery model
         */
        getFilterParmeter: function () {
            return this.getOwnerComponent().getModel("globalFilterParam");
        },
        /**
         * Convenience method to get the global model containing the global state of the app.
         * @returns {object} the global Propery model
         */
        getCartModel: function () {
            return this.getOwnerComponent().getModel("CartProperties");
        },
        /**
         * Convenience method
         * @returns {object} the application controller
         */
        getApplication: function () {
            return this.getGlobalModel().getProperty("/application");
        },

        /**
         * Convenience method checking login token
         * @returns {object} the application controller
         */

        login: function (username, password) {
            var that = this;
            var logonData = {
                username: username,
                password: password
            };
            var returnCallback = false;
            var onSuccess = function (res, status, xhr) {
                    var logonResult = res.username !== "" && res.password !== "";
                    //process after login
                    if (logonResult) {
                        //post-process
                        this.setAccountModel(res);
                        // save_login
                        localStorage.setItem("accountId", res.accountId);
                        localStorage.setItem("username", username);
                        localStorage.setItem("password", password);
                    } else {
                        logonResult = false;
                        //if login = false
                    }
                    //Off-Busy after proceed
                    returnCallback = logonResult;
                },
                onError = function (jqXHR, textStatus, errorThrown) {
                    //Mock-backend test login

                    // that._LoginDialog.getModel("loginResult").setProperty("/failed", true);
                    // console.log("Got an error response: " + textStatus + errorThrown);
                    // //Off-Busy after proceed
                };
            var serverInfo = models.getServerInfo();
            var url = "",
                method = "GET";
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/account.json";
            } else {
                method = "POST";
                url = serverInfo.url + "/dang-nhap-shop";
            }

            $.ajax({
                data: logonData,
                url: url,
                type: method,
                async: false,

                //end-local
                dataType: "json",
                context: this,
                success: onSuccess,
                error: onError
            });
            return returnCallback;
        },
        checkLogin: function () {
            var isLogon = false;
            var accountModel = this.getModel("account");
            if (accountModel) {
                var accId = accountModel.getProperty("/accountId");
                isLogon = accId !== null && accId !== "";
            }
            return isLogon;
        },

        setPassData: function (key, value) {
            var passModel = this.getOwnerComponent().getModel("pasModel");
            if (!passModel) {
                passModel = new JSONModel();
                this.getOwnerComponent().setModel(passModel, "pasModel");
            }
            passModel.setProperty("/" + key, value, null, false);
            return true;
        },
        checkPassData: function (key) {
            var passModel = this.getOwnerComponent().getModel("pasModel");
            if (!passModel) {
                passModel = new JSONModel();
                this.getOwnerComponent().setModel(passModel, "pasModel");
            }
            return passModel.getProperty("/" + key) !== undefined;
        },
        consumePassData: function (key) {
            var passModel = this.getOwnerComponent().getModel("pasModel");
            if (!passModel) {
                passModel = new JSONModel();
                this.getOwnerComponent().setModel(passModel, "pasModel");
            }
            var value = passModel.getProperty("/" + key);
            passModel.setProperty("/" + key, undefined, null, false);
            return value;
        },

        setAccountModel: function (d) {
            var accountModel = this.getModel("account");
            if (!accountModel) {
                accountModel = new JSONModel();
                this.getOwnerComponent().setModel(accountModel, "account");
            }
            accountModel.setProperty("/", d);
            return accountModel;
        },

        backToHome: function () {
            this.getRouter().navTo("home");
        },

        sellItems: function () {
            this.getRouter().navTo("sellItem");
        },


        /*************************************************************************************************/
        openDialogLogin: function () {
            if (!this._LoginDialog) {
                this._LoginDialog = sap.ui.xmlfragment(this.getId(), "sap.ui.demo.basicTemplate.fragment.Login",
                    this);
                var loginDialogModel = new JSONModel({
                    username: "",
                    password: "",
                    failed: false,
                    isLogging: false
                });
                this._LoginDialog.setModel(loginDialogModel, "loginResult");
                //Set models which is belonged to View to Fragment
                this.getView().addDependent(this._LoginDialog);
            }
            this._LoginDialog.open();
        },

        openDialogRegister: function () {
            if (!this._RegisterDialog) {
                this._RegisterDialog = sap.ui.xmlfragment(this.getId(), "sap.ui.demo.basicTemplate.fragment.Register",
                    this);
                var registerDialogModel = new JSONModel({
                    email: "",
                    password: ""
                });
                this._RegisterDialog.setModel(registerDialogModel, "registerResult");
                //Set models which is belonged to View to Fragment
                this.getView().addDependent(this._RegisterDialog);
            }
            this._RegisterDialog.open();
        },

        /**
         * Event handler for the continue button
         */
        checkInputRegister: function () {
            var that = this;
            // collect input controls
            var registerModel = this._RegisterDialog.getModel("registerResult");
            var email = registerModel.getProperty("/email");
            var password = registerModel.getProperty("/password");

            $.ajax({
                type: "POST",
                data: {
                    username: email,
                    password: password
                },
                crossDomain: true,
                url: "http://192.168.0.6:8080/dang-ky",
                dataType: "json",
                success: onSuccess,
                error: function (jqXHR, textStatus, errorThrown) {
                }

            });
        },

        dialogAfterclose: function () {
            if (this._oDialog) {
                this._oDialog.destroy(); //destroy only the content inside the Dialog
            }
        },

        /**
         * Event handler for the notification button
         * @param {sap.ui.base.Event} oEvent the button press event
         * @public
         */
        onNotificationPress: function (oEvent) {
            // close message popover
            var oMessagePopover = this.byId("errorMessagePopover");
            if (oMessagePopover && oMessagePopover.isOpen()) {
                oMessagePopover.destroy();
            }

            var placement = oEvent.getSource();
            var alertPo = this.byId("poAlert");
            alertPo.openBy(placement);
        },

        onUserNamePress: function (oEvent) {
            if (!this.oActionSheet) {
                this.oActionSheet = this.byId("userMessageActionSheet");
            }
            this.oActionSheet.openBy(oEvent.getSource());
            this.oActionSheet.setVisible(true);
        },
        getSavedLoginData: function () {
            return {
                username: localStorage.getItem("username"),
                password: localStorage.getItem("password")
            };
        },
        removeLocalLoginData: function () {
            this.getOwnerComponent().setModel(null, "account");
            localStorage.removeItem("username");
            localStorage.removeItem("password");
            localStorage.removeItem("accountId");

        },
        doAutoLogin: function () {
            var loginInfo = this.getSavedLoginData();
            var logon = this.login(loginInfo.username, loginInfo.password);
            if (logon) {
                this.getRouter().navTo("transaction", true);
            } else {
                this.getView().setBusy(false);
                this.txtPassword.setValue("");
            }
            this.busyDialog.close();
            return logon;
        },
        logout: function () {
            this.removeLocalLoginData();
            this.getRouter().navTo("login", true);
        },

        filterTable: function (aCurrentFilterValues) {
            this.getTableItems().filter(this.getFilters(aCurrentFilterValues));
            this.updateFilterCriterias(this.getFilterCriteria(aCurrentFilterValues));
        },

        onSearch: function (oEvent) {
            var value = oEvent.getParameter("query");
        }
    });

});