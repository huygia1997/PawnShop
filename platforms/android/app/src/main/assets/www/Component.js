sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "mortgage/pawnshop/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (UIComponent, Device, models, JSONModel, MessageToast) {
    "use strict";

    return UIComponent.extend("mortgage.pawnshop.Component", {

        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */

        init: function () {
            // call the base component's init function
            sap.ui.getCore().getConfiguration().setLanguage("vi");
            UIComponent.prototype.init.apply(this, arguments);

            var lblHome = this.getModel("i18n").getResourceBundle().getText("navToHome");
            this.setModel(models.createGlobalModel(), "global");
            //init master data
            this.initCategoryData();
            this.initLocationData();
            this.setModel(models.createDeviceModel(), "device");
            this.getRouter().getTargetHandler().setCloseDialogs(false);
            // this.getModel().attachRequestFailed(this.requestFailed, this);
            this.getRouter().initialize();
            // set the device model


        },
        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        },
        initCategoryData: function () {
            var cateModel = this.getModel("category");
            if (!cateModel) {
                cateModel = new JSONModel();
                this.setModel(cateModel, "category");
            }
            var cateData = models.getCategorySet();
            cateModel.setProperty("/", cateData);
        },
        initLocationData: function () {
            var cityModel = this.getModel("city");
            if (!cityModel) {
                cityModel = new JSONModel();

                this.setModel(cityModel, "city");
            }
            var cityList = models.getCities();
            cityModel.setProperty("/", cityList);
            var districtModel = this.getModel("district");
            if (!districtModel) {
                districtModel = new JSONModel();
                this.setModel(districtModel, "district");
            }
            // var districtList = models.getDistricts();
            // districtModel.setProperty("/", districtList);
        },
        requestFailed: function (oEvent) {

        }
    });

});