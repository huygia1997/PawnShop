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

    return BaseController.extend("mortgage.pawnshop.controller.SalesItems", {
        formatter: formatter,
        onInit: function () {

            this.getRouter().getRoute("sales").attachPatternMatched(this._onObjectMatched, this);
            //
        },
        _onObjectMatched: function (oEvent) {
            var isLiquidating = this.checkPassData("liquidate");
            if (isLiquidating) {
                this.getRouter().navTo("createSales", false);
            }
            this.bindShopConfigModel();
        },
        bindShopConfigModel: function () {
            var accountModel = this.getModel("account");
            if (!accountModel) {
                this.getRouter().navTo("login", true);
                return;
            }
            var shopId = accountModel.getProperty("/shop/id");
            var model = this.getModel("sales");
            if (!model) {
                model = new JSONModel();
                this.setModel(model, "sales");
            }
            var data = models.getSalesItems(shopId);
            model.setProperty("/", data);
        },
        handleUserInput: function (oEvent) {
            var check = false;
            var sUserInput = oEvent.getParameter("value");
            var oInputControl = oEvent.getSource();
            if (!sUserInput || sUserInput == "") {
                oInputControl.setValueState(sap.ui.core.ValueState.Error);
                this.checkRegister = false;
            } else {
                oInputControl.setValueState(sap.ui.core.ValueState.Success);
                check = true;
            }
            return check;
        },
        onUploadPress: function (oEvt) {
            var that = this;
            var oFileUploader = oEvt.getSource();
            var aFiles = oEvt.getParameters().files;
            var currentFile = aFiles[0];
            var msgUploadingPic = this.getResourceBundle().getText("msgUploadingPic");
            var msgPleaseWait = this.getResourceBundle().getText("msgPleaseWait");
            this.openBusyDialog({
                title: msgUploadingPic,
                text: msgPleaseWait,
                showCancelButton: true
            });
            this.resizeAndUpload(currentFile, {
                success: function (oEvt) {
                    oFileUploader.setValue("");
                    console.log(oEvt);
                    //Here the image is on the backend, so i call it again and set the image
                    var model = that.salesItemDialog.getModel("currentSalesItem");
                    if (!model) {
                        return;
                    }
                    var currentSalesItem = model.getProperty("/");
                    var data = {
                        idCloud: oEvt.data.id,
                        deleteHash: oEvt.data.deletehash,
                        picUrl: oEvt.data.link,
                        objId: currentSalesItem.saleItem.id,
                        type: 2
                    };
                    var result = models.addImg(data);
                    if (result) {
                        that.bindShopConfigModel();
                        that.reloadAvatarPic(currentSalesItem.saleItem.id, false);
                        that.bindCurrentSalesItemModel(null, currentSalesItem.saleItem.id);
                        model.updateBindings(true);
                    }
                    that.closeBusyDialog();
                    // that.byId("carUploadedImg").addPage(
                    //     new sap.m.Image({
                    //         width: '80%',
                    //         densityAware: false,
                    //         decorative: false,
                    //         src: encodeURI(oEvt.data.link)
                    //     }));
                },
                error: function (oEvt) {
                    //Handle error here
                    that.closeBusyDialog();
                }
            });
        },
        reloadAvatarPic: function (salesItemId, queryFromBackend) {
            if (queryFromBackend) {
                this.bindShopConfigModel();
            }
            var salesItem = this.onLoadCurrentSalesItem(salesItemId);
            if (salesItem.pictureList.length > 0) {
                salesItem.saleItem.picUrl = salesItem.pictureList[0].pictureUrl;
            } else {
                salesItem.saleItem.picUrl = "https://i.imgur.com/UOkVB0P.png";
            }
            return this.updateSalesItem(salesItem);

        },
        onDeletePic: function () {
            var that = this;
            var carousel = this.byId("carUploadedImg");
            var currentImage = carousel.getActivePage();
            var cI = sap.ui.getCore().byId(currentImage);
            var currentSalesItemModel = this.salesItemDialog.getModel("currentSalesItem");
            var imgList = currentSalesItemModel.getProperty("/pictureList");
            var context = cI.getBindingContext("currentSalesItem");
            if (context) {
                var picData = context.getProperty("");
                var index = -1;
                for (var i = 0; i < imgList.length; i++) {
                    if (imgList[i] === picData) {
                        index = i;
                    }
                }
                if (index === -1) {
                    return;
                    // no img
                }
                var callback = {
                    success: function () {
                        that.bindShopConfigModel();
                        var currentSalesItemId = currentSalesItemModel.getProperty("/saleItem/id");
                        that.reloadAvatarPic(currentSalesItemId, false);
                        that.bindCurrentSalesItemModel(null, currentSalesItemId);
                        that.salesItemDialog.getModel("currentSalesItem").updateBindings(true);
                        that.closeBusyDialog();
                    },
                    error: function () {
                        that.closeBusyDialog();
                        MessageToast.show();
                    }
                };

                // delete on cloud and back-end
                //*set Busy before*
                this.openBusyDialog({
                    showCancelButton: true
                });
                models.deleteImg(picData.id, picData.idCloud, callback);
            }
        },
        resizeAndUpload: function (file, mParams) {
            var that = this;
            var reader = new FileReader();
            reader.onerror = function (e) {
                //handle error here
            };
            reader.onloadend = function () {
                var tempImg = new Image();
                tempImg.src = reader.result;
                tempImg.onload = function () {
                    that.uploadFile(tempImg.src, mParams, file);
                }
            };
            reader.readAsDataURL(file);
        },

        uploadFile: function (dataURL, mParams, file) {
            var xhr = new XMLHttpRequest();
            var BASE64_MARKER = 'data:' + file.type + ';base64,';
            var base64Index = dataURL.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
            var base64string = dataURL.split(",")[1];

            xhr.onreadystatechange = function (ev) {
                if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 201)) {
                    mParams.success(JSON.parse(xhr.response));
                } else if (xhr.readyState == 4) {
                    mParams.error(ev);
                }
            };
            var URL = "https://api.imgur.com/3/upload";
            var fileName = (file.name === "image.jpeg") ? "image_" + new Date().getTime() + ".jpeg" : file.name;
            xhr.open('POST', URL, true);
            xhr.setRequestHeader("Content-type", file.type);//"application/x-www-form-urlencoded");
            xhr.setRequestHeader("Authorization", "Bearer 5c25e781ffc7f495059078408c311799e277d70e");//"application/x-www-form-urlencoded");
            var data = base64string;
            xhr.send(data);
        },
        onCreateSalesPressed: function () {
            this.getRouter().navTo("createSales", false);
        },

        onSalesPressed: function (e) {
            //Get data of current SalesItem line
            var selectedLine = e.getParameter("srcControl");
            if (!selectedLine) {
                return;
            }
            var data = selectedLine.getBindingContext("sales").getProperty("");
            //Init & Bind SalesItemDialog
            if (!this.salesItemDialog) {
                this.salesItemDialog = this.initFragment("mortgage.pawnshop.fragment.SalesItemDetail", "currentSalesItem");
            }
            var currentSalesItem = this.onLoadCurrentSalesItem(data.saleItem.id);
            this.bindCurrentSalesItemModel(currentSalesItem);

            this.salesItemDialog.open();
        },
        bindCurrentSalesItemModel: function (salesItemObject, salesItemId) {
            var currentItemObject;
            if (salesItemId) {
                currentItemObject = this.onLoadCurrentSalesItem(salesItemId);
            } else {
                currentItemObject = salesItemObject;
            }
            if (!this.salesItemDialog) {
                this.salesItemDialog = this.initFragment("mortgage.pawnshop.fragment.SalesItemDetail", "currentSalesItem");
            }
            var currentSalesItemModel = this.salesItemDialog.getModel("currentSalesItem");
            if (!currentSalesItemModel) {
                currentSalesItemModel = new JSONModel();
            }
            currentSalesItemModel.setProperty("/", currentItemObject);
        },
        onLoadCurrentSalesItem: function (salesItemId) {
            var salesItemModel = this.getModel("sales");
            if (!salesItemModel) {
                return;
            }
            var salesItems = salesItemModel.getProperty("/");
            for (var i = 0; i < salesItems.length; i++) {
                if (salesItems[i].saleItem.id === salesItemId) {
                    //Init & Bind SalesItemDialog

                    return salesItems[i];
                }
            }
        },
        onCancelSalesItem: function () {
            var currentSalesItemModel = this.salesItemDialog.getModel("currentSalesItem");
            if (!currentSalesItemModel) {
                return;
            }
            var data = currentSalesItemModel.getProperty("/");
            var submitData = {
                itemId: data.saleItem.id,
                status: 4
            };
            var result = models.changeSalesItem(submitData);
            if (result) {
                this.bindShopConfigModel();
                MessageToast.show(this.getResourceBundle().getText("msgSalesItemCanceled"));
                this.salesItemDialog.close();
            }
        },
        onSetAsSold: function () {
            var currentSalesItemModel = this.salesItemDialog.getModel("currentSalesItem");
            if (!currentSalesItemModel) {
                return;
            }
            var data = currentSalesItemModel.getProperty("/");
            var submitData = {
                itemId: data.saleItem.id,
                status: 2
            };
            var result = models.changeSalesItem(submitData);
            if (result) {
                this.bindShopConfigModel();
                MessageToast.show(this.getResourceBundle().getText("msgSetAsSold"));
                this.salesItemDialog.close();
            }
        },
        onUpdateSalesItemPressed: function () {
            var currentSalesItemModel = this.salesItemDialog.getModel("currentSalesItem");
            if (!currentSalesItemModel) {
                return;
            }
            var data = currentSalesItemModel.getProperty("/");
            var result = this.updateSalesItem(data);
            if (result) {
                MessageToast.show(this.getResourceBundle().getText("msgUpdateSalesItemSuccessfully"));
            } else {
                //handle error here
            }
        },
        updateSalesItem: function (data) {
            var submitData = {
                itemId: data.saleItem.id,
                description: data.saleItem.description,
                avaUrl: data.saleItem.picUrl,
                itemName: data.saleItem.itemName,
                price: data.saleItem.price
            };
            var result = models.updateSalesItem(submitData);
            if (result) {
                this.bindShopConfigModel();
            }
            return result;

        }
    });
});