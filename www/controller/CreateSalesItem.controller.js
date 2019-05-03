sap.ui.define([
	"mortgage/pawnshop/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"mortgage/pawnshop/model/formatter",
	"sap/m/BusyDialog",
	"mortgage/pawnshop/model/models",
	"sap/m/MessageStrip",
	'sap/m/MessageBox'
], function(BaseController, MessageToast, JSONModel, Filter, formatter, BusyDialog, models, MessageStrip, MessageBox) {
	"use strict";

	return BaseController.extend("mortgage.pawnshop.controller.CreateSalesItem", {
		formatter: formatter,
		onInit: function() {
			this.getRouter().getRoute("createSales").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function(e) {
			if (!this.checkLogin()) {
				this.getRouter().navTo("login", true);

			} else {
				var isLiquidating = this.checkPassData("liquidate");
				if (isLiquidating) {
					var liquidateData = this.consumePassData("liquidate");
					this.parseTransactionDataToSalesData(liquidateData);
				} else {
					this.loadInitTransaction();
				}
			}

		},
		parseTransactionDataToSalesData: function(transData) {
			var initData = {
				itemName: transData.transaction.itemName,
				price: "0",
				picturesObj: transData.pictureList,
				description: "",
				categoryId: "",
				transId: transData.transaction.id
			};
			var createSalesModel = this.getModel("createSalesItem");
			if (!createSalesModel) {
				createSalesModel = new JSONModel();
				this.setModel(createSalesModel, "createSalesItem");
			}
			createSalesModel.setProperty("/", initData, null, false);
			console.log(createSalesModel.getProperty("/picturesObj"));
		},
		onClearPressed: function() {
			this.loadInitTransaction();
		},
		loadInitTransaction: function() {
			var initData = {
				itemName: "",
				price: "0",
				picturesObj: [],
				description: "",
				categoryId: "",
				transId: ""
			};
			var createSalesModel = this.getModel("createSalesItem");
			if (!createSalesModel) {
				createSalesModel = new JSONModel();
				this.setModel(createSalesModel, "createSalesItem");
			}
			createSalesModel.setProperty("/", initData, null, false);
			console.log(createSalesModel.getProperty("/picturesObj"));
		},

		onUploadPress: function(oEvt) {
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
				success: function(oEvt) {
					oFileUploader.setValue("");
					console.log(oEvt);
					//Here the image is on the backend, so i call it again and set the image
					var model = that.getModel("createSalesItem");
					if (!model) {
						return;
					}
					var pics = model.getProperty("/picturesObj");
					pics.push({
						pictureUrl: encodeURI(oEvt.data.link),
						idCloud: oEvt.data.id,
						deleteHash: oEvt.data.deletehash
					});
					model.updateBindings(true);
					that.closeBusyDialog();
				},
				error: function(oEvt) {
					//Handle error here
					that.closeBusyDialog();
				}
			});
		},

		onDeletePic: function() {
			var that = this;
			var carousel = this.byId("carUploadedImg");
			var currentImage = carousel.getActivePage();
			var cI = sap.ui.getCore().byId(currentImage);
			var imgList = this.getModel("createSalesItem").getProperty("/picturesObj");
			var context = cI.getBindingContext("createSalesItem");
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
					success: function() {
						imgList.splice(index, 1);
						that.getModel("createSalesItem").updateBindings(true);
						that.closeBusyDialog();
					},
					error: function() {
						that.closeBusyDialog();
						MessageToast.show();
					}
				};

				// delete on cloud and back-end
				//*set Busy before*
				this.openBusyDialog({
					showCancelButton: true
				});
				var svDeleted = models.deleteImg(null, picData.idCloud, callback);
				if (svDeleted) {

				}
			}
		},
		resizeAndUpload: function(file, mParams) {
			var that = this;
			var reader = new FileReader();
			reader.onerror = function(e) {
				//handle error here
			};
			reader.onloadend = function() {
				var tempImg = new Image();
				tempImg.src = reader.result;
				tempImg.onload = function() {
					that.uploadFile(tempImg.src, mParams, file);
				}
			};
			reader.readAsDataURL(file);
		},
		uploadFile: function(dataURL, mParams, file) {
			var xhr = new XMLHttpRequest();
			var BASE64_MARKER = 'data:' + file.type + ';base64,';
			var base64Index = dataURL.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
			var base64string = dataURL.split(",")[1];

			xhr.onreadystatechange = function(ev) {
				if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 201)) {
					mParams.success(JSON.parse(xhr.response));
				} else if (xhr.readyState == 4) {
					mParams.error(ev);
				}
			};
			var URL = "https://api.imgur.com/3/upload";
			var fileName = (file.name === "image.jpeg") ? "image_" + new Date().getTime() + ".jpeg" : file.name;
			xhr.open('POST', URL, true);
			xhr.setRequestHeader("Content-type", file.type); //"application/x-www-form-urlencoded");
			xhr.setRequestHeader("Authorization", "Bearer 5c25e781ffc7f495059078408c311799e277d70e"); //"application/x-www-form-urlencoded");
			var data = base64string;
			xhr.send(data);
		},

		submitSalesItemPressed: function() {
			//get binding model from current view
			var model = this.getModel("createSalesItem");
			if (!model) {
				return;
			}
			//****************parse data before submit
			var submitData = model.getProperty("/");
			//set Default pictures
			if (submitData.picturesObj.length > 0) {
				submitData.picUrl = submitData.picturesObj[0].pictureUrl;
			} else {
				submitData.picUrl = "https://i.imgur.com/UOkVB0P.png";
			}
			submitData.pictures = JSON.stringify(submitData.picturesObj);
			// Set Item's Category Id
			submitData.categoryId = this.byId("selectCate").getSelectedItem().getBindingContext("category").getProperty("id");
			// Set Posting date
			var date = new Date();
			date.setHours(7);
			submitData.liquidDate = date;
			// Set Transaction ID, in case no transId defined, Use Default TransId
			if (!submitData.transId) {
				//default transId retrieved from Shop Info
				var shopModel = this.getModel("account");
				if (!shopModel) {
					//Session Exception, re-login with errors.
					this.getRouter().navTo("login");
					return;
				}
				var shopId = shopModel.getProperty("/shop/id");
				var shopTransDefaults = shopModel.getProperty("/shopTransDefaults");
				if (shopTransDefaults.length) {
					for (var i = 0; i < shopTransDefaults.length; i++) {
						if (shopId === shopTransDefaults[i].shop.id) {
							submitData.transId = shopTransDefaults[i].transDefaultId;
						}
					}
				}
				// submitData.transId = shopModel.getProperty("/transDefaultId");
			}
			if (submitData.itemName === "" || submitData.description === "" || submitData.price === "") {
				MessageBox.error("Thông tin món hàng chưa chính xác!");
			} else {
				var data = models.postCreateSalesItem(submitData);
				if (data) {
					var dataTrans = {
						transactionId: submitData.transId
					};
					var checkTransDefault = models.checkTransDefault(dataTrans);
					if (!checkTransDefault) {
						var liqData = {
							transactionId: submitData.transId,
							description: "Thanh lý"
						};
						data = models.postLiquidate(liqData);
					}
					// var sucMsg = this.getResourceBundle().getText("msgCreateSuccessful");
					// MessageToast.show(sucMsg);
					MessageBox.success("Tạo món hàng thành công!");
					this.back();
				}
			}
		},

		changePasswordPress: function() {
			this.changePassDialog.open();
		}

	});
});