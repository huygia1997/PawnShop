sap.ui.define([
    "mortgage/pawnshop/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "mortgage/pawnshop/model/formatter",
    "sap/m/BusyDialog",
    "mortgage/pawnshop/model/models",
    "sap/m/MessageStrip"
], function (BaseController, MessageToast, JSONModel, Filter, formatter, BusyDialog, models, MessageStrip) {
    "use strict";

    return BaseController.extend("mortgage.pawnshop.controller.CreateTransaction", {
        formatter: formatter,

        onInit: function () {
            this.getRouter().getRoute("creTrans").attachPatternMatched(this._onObjectMatched, this);
        },
        backWOpt: function () {
            var createTransModel = this.getModel("createTrans");
            if (!createTransModel) {
                this.loadInitTransaction();
            }
            var transId = createTransModel.getProperty("/transId");
            this.setPassData("currentTransId", transId);
            this.back();
        },
        onClearPressed: function () {
            this.loadInitTransaction();
            this.loadInitCateConfig();
        },
        loadInitTransaction: function () {
            var accountModel = this.getModel("account");
            if (!accountModel) {
                this.getRouter().navTo("login", true);
                return;
            }
            var createTransModel = this.getModel("createTrans");
            if (!createTransModel) {
                createTransModel = new JSONModel();
                this.setModel(createTransModel, "createTrans");
            }
            var initValues = {
                pawneeId: "4",
                pawneeName: "",
                email: "",
                phone: "",
                address: "",
                addressObject: {
                    streetName: "",
                    city: "",
                    district: ""
                },
                identityNumber: "",
                picturesObj: [],
                pictures: "",
                attributes: "",
                shopId: accountModel.getProperty("/shop/id"),
                itemName: "",
                pawneeInfoId: "4",
                paymentTerm: "",
                paymentType: "1",
                startDate: new Date(),
                basePrice: null,
                uoc: 'VND',
                liquidateAfter: "",
                categoryId: "",
                note: ""
            };
            createTransModel.setProperty("/", initValues, null, false);
            return createTransModel;
        },
        loadInitCateConfig: function () {
            var cateConfigModel = this.getModel("cateConfig");
            if (!cateConfigModel) {
                //Handle error loading shop CateConfig here
                return;
            }
            var validCate = [];
            var data = cateConfigModel.getProperty("/");
            for (var i = 0; i < data.length; i++) {
                if (data[i].status === 1) {
                    validCate.push(data[i]);
                }
            }
            //     model.setProperty("/", data);
            this.changeCurrentCateConfig(validCate[0]);
        },

        onCityChanged: function (e) {
            var cityId = e.getParameter("selectedItem").getBindingContext("city").getProperty("id");
            this.filterDistrictByCity(cityId);
        },
        filterDistrictByCity: function (cityId) {
            var districts = models.getDistrictsByCity(cityId);
            var districtModel = this.getModel("district");
            if (!districtModel) {
                districtModel = new JSONModel();
                this.setModel(districtModel, "district");
            }
            districtModel.setProperty("/", districts);
            districtModel.updateBindings(true);
        },

        _onObjectMatched: function (oEvent) {
            if (!this.checkLogin()) {
                this.getRouter().navTo("login", true);

            } else {
                this.loadInitTransaction();
                var replacedTrans = this.consumePassData("replacedTrans");
                if (replacedTrans) { // Replace Transaction triggered
                    this.parseOldTransData(replacedTrans);
                } else { //normal use-case
                    this.loadInitCateConfig();

                }
            }
        },

        parseOldTransData: function (replacedTrans) {
            var createTransModel = this.getModel("createTrans");
            if (!createTransModel) {
                createTransModel = this.loadInitTransaction();
            }
            var createTransData = createTransModel.getProperty("/");
            //fill pawnee info
            createTransData.email = replacedTrans.transaction.pawneeInfo.email;
            this.fillPawneeData(replacedTrans.transaction.pawneeInfo.email);
            // fill item info
            var currentConfigModel = this.getModel("currentConfig");
            var attrList = replacedTrans.transactionItemAttributes;
            if (!currentConfigModel) {
                currentConfigModel = new JSONModel();
            }
            currentConfigModel.setProperty("/",
                {
                    category: replacedTrans.transaction.category,
                    liquidateAfter: replacedTrans.transaction.liquidateAfter,
                    paymentTerm: replacedTrans.transaction.paymentTerm,
                    paymentType: replacedTrans.transaction.paymentType,
                    value1: attrList[0].attributeName,
                    value2: attrList[1].attributeName,
                    value3: attrList[2].attributeName,
                    value4: attrList[3].attributeName
                }, null, false);
            this.setModel(currentConfigModel, "currentConfig");
            createTransData.itemName = replacedTrans.transaction.itemName;
            // for (var i = 0; i < attrList.length; i++) {
            //     if (attrList[i].attributeName !== "") {
            //         currentConfig["value" + i] = attrList[i].attributeName;
            //         createTransData["value" + i] = attrList[i].attributeValue;
            //     }
            // }
            createTransData.value1 = attrList[0].attributeValue;
            createTransData.value2 = attrList[1].attributeValue;
            createTransData.value3 = attrList[2].attributeValue;
            createTransData.value4 = attrList[3].attributeValue;
            //fil payment info
            createTransData.paymentTerm = replacedTrans.transaction.paymentTerm;
            createTransData.paymentType = replacedTrans.transaction.paymentType;
            createTransData.basePrice = replacedTrans.transaction.basePrice;
            createTransData.startDate = function () {
                var da = new Date();
                da.setHours(7);
                return da;
            };
            createTransData.liquidateAfter = replacedTrans.transaction.liquidateAfter;
            createTransData.transId = replacedTrans.transaction.id;
            for (var i = 0; i < replacedTrans.pictureList.length; i++) {
                var pic = {
                    pictureUrl: replacedTrans.pictureList[i].pictureUrl,
                    idCloud: replacedTrans.pictureList[i].idCloud,
                    deleteHash: replacedTrans.pictureList[i].deleteHash
                };
                createTransData.picturesObj.push(pic);
            }
            createTransModel.setProperty("/", createTransData);
            createTransModel.updateBindings(true);
        },
        // bindShopConfigForCreateTrans: function () {
        //     var shopId = this.getModel("account").getProperty("/shop/id");
        //     var model = this.getModel("shopConfig");
        //     if (!model) {
        //         model = new JSONModel();
        //         this.setModel(model, "shopConfig");
        //     }
        //     var data = models.getCateConfigSet(shopId);
        //     model.setProperty("/", data);
        //     this.changeCurrentCateConfig(data[0]);
        // },

        forceChangePass: function () {
            this.changePasswordPress();
        },

        changePasswordPress: function () {
            this.changePassDialog.open();
        },
        onUploadPress: function (oEvt) {
            var that = this;
            var oFileUploader = oEvt.getSource();
            var aFiles = oEvt.getParameters().files;
            var currentFile = aFiles[0];
            this.resizeAndUpload(currentFile, {
                success: function (oEvt) {
                    oFileUploader.setValue("");
                    console.log(oEvt);
                    //Here the image is on the backend, so i call it again and set the image
                    var model = that.getModel("createTrans");
                    if (!model) {
                        return;
                    }
                    var pics = model.getProperty("/picturesObj");
                    pics.push({
                        pictureUrl: encodeURI(oEvt.data.link),
                        idCloud: oEvt.data.id,
                        deleteHash: oEvt.data.deletehash
                    })
                    ;
                    model.updateBindings(true);
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
                }
            });
        },
        onDeletePic: function () {
            var model = this.getModel("createT rans");
            if (!model) {
                return;
            }
            var car = this.byId("carUploadedImg");
            var binding = car.getActivePage().getBindings("src");
            if (binding) {
                var path = binding.getPath();
                //do sth to remove this from pictures Array
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

        onCateConfigChanged: function (e) {
            var selectedItem = e.getParameter("selectedItem");
            var confData = selectedItem.getBindingContext("cateConfig").getProperty("");
            this.changeCurrentCateConfig(confData);
        },

        changeCurrentCateConfig: function (confData) {
            var currentConfigModel = this.getModel("currentConfig");
            if (!currentConfigModel) {
                currentConfigModel = new JSONModel();
                this.setModel(currentConfigModel, "currentConfig");
            }
            currentConfigModel.setProperty("/", confData, null, false);
            this.getModel("createTrans").setProperty("/paymentTerm", confData.paymentTerm, null, false);
            this.getModel("createTrans").setProperty("/paymentType", confData.paymentType, null, false);
            this.getModel("createTrans").setProperty("/liquidateAfter", confData.liquidateAfter, null, false);

        },

        onSubmitCreateTransaction: function () {
            var sendingData = this.parseSendData();
            var result = models.postCreateTransaction(sendingData);
            var msgCreateTransSuccessfully = this.getResourceBundle().getText("msgCreateTransSuccessfully");
            if (result.result) {
                if (sendingData.transId) { // trigger Replace Function
                    var submitData = {
                        transactionId: sendingData.transId,
                        description: "",
                        replaceId: result.response.id
                    };
                    var cancelResult = models.postCancel(submitData);
                    if (cancelResult) {
                        //ok
                        msgCreateTransSuccessfully = this.getResourceBundle().getText("msgReplaceTransSuccessfully");
                    }
                }
                MessageToast.show(msgCreateTransSuccessfully);
                this.back();
            } else {
                //handle error
                var msgCreateTransError = this.getResourceBundle().getText("msgCreateTransError");
                this.getView().addContent(new MessageStrip("mstripCreateTrans", {
                    text: msgCreateTransError,
                    showCloseButton: false,
                    showIcon: true,
                    type: "Error"
                }));
            }
        },
        onPawneeChanged: function (e) {
            var email = e.getParameter("value");
            this.fillPawneeData(email);
        },
        fillPawneeData: function (email) {
            var accountModel = this.getModel("account");
            if (!accountModel) {
                this.getRouter().navTo("login", true);
                return;
            }
            var createTransModel = this.getModel("createTrans");
            if (!createTransModel) {
                return;
            }
            var shopId = accountModel.getProperty("/shop/id");

            var pawneeData = models.getPawneeInfo(email, shopId);
            if (pawneeData.pawnee) {
                //Change sending field `pawneeId`
                createTransModel.setProperty("/pawneeId", pawneeData.pawnee.id);
            }
            if (pawneeData.pawneeInfo) {
                //Change sending `pawneeInfo`
                createTransModel.setProperty("/pawneeInfoId", pawneeData.pawneeInfo.id);
                var addressObject = {
                    streetName: "",
                    city: "",
                    district: ""
                };
                var addObj = pawneeData.pawneeInfo.address.split(", ");
                if (addObj.length > 1) {
                    addressObject.city = addObj[addObj.length - 1];
                    addObj.pop();
                    addressObject.district = addObj[addObj.length - 1];
                    addObj.pop();
                    var streetName = "";
                    for (var a in addObj) {
                        streetName += a;
                    }
                    addressObject.streetName = streetName;
                }
                createTransModel.setProperty("/addressObject", addressObject);
                createTransModel.setProperty("/pawneeName", pawneeData.pawneeInfo.name);
                createTransModel.setProperty("/phone", pawneeData.pawneeInfo.phoneNumber);
                createTransModel.setProperty("/identityNumber", pawneeData.pawneeInfo.identityNumber);

            }
        },
        parseSendData: function () {
            var createModel = this.getModel("createTrans");
            if (!createModel) {
                return;
            }
            var data = createModel.getProperty("/");
            data.address = data.addressObject.streetName + ", " +
                data.addressObject.district + ", " +
                data.addressObject.city;
            var currentConfig = this.getModel("currentConfig").getProperty("/");
            // format attributes to key-value pair string
            var attrs = [];
            if (currentConfig.value1 !== null) {
                attrs.push(currentConfig.value1 + ":" + data.value1 || "N/A");
            }
            if (currentConfig.value2 !== null) {
                attrs.push(currentConfig.value2 + ":" + data.value2 || "N/A");
            }
            if (currentConfig.value3 !== null) {
                attrs.push(currentConfig.value3 + ":" + data.value3 || "N/A");
            }
            if (currentConfig.value4 !== null) {
                attrs.push(currentConfig.value4 + ":" + data.value4 || "N/A");
            }
            data.attributes = attrs.join(",");
            //send category id
            data.categoryId = currentConfig.category.id;
            data.startDate.setHours(7);
            //parse Pictures json to  string
            data.pictures = JSON.stringify(data.picturesObj);
            
            return data;

        },


        doChangePass: function () {
            var that = this;
            var onSuccess = function (data) {
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
                onError = function (error) {
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
        //         }
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