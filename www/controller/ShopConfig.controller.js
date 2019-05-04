sap.ui.define([
	"mortgage/pawnshop/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"mortgage/pawnshop/model/formatter",
	"sap/m/BusyDialog",
	"mortgage/pawnshop/model/models",
	'sap/m/MessageBox'
], function(BaseController, MessageToast, JSONModel, Filter, formatter, BusyDialog, models, MessageBox) {
	"use strict";
	var gMap, markers;
	return BaseController.extend("mortgage.pawnshop.controller.ShopConfig", {
		formatter: formatter,
		onInit: function() {

			this.getRouter().getRoute("shopConfig").attachPatternMatched(this._onObjectMatched, this);

		},
		_onObjectMatched: function(oEvent) {
			if (!this.checkLogin()) {
				this.getRouter().navTo("login", true);
			}
			this.bindShopConfigModel();
			// var mapOptions = {
			//     center: new google.maps.LatLng(0, 0),
			//     zoom: 1,
			//     mapTypeId: google.maps.MapTypeId.ROADMAP
			// };
			// gMap = new google.maps.Map(this.getView().byId("map_canvas").getDomRef(), mapOptions);
			// this.initialModelBinding();
			//whenever page is called, it comes to this func
			// this.loadMap(0, 0);
			// this.getView().byId("map_canvas").addStyleClass("myMap");

		},

		initialModelBinding: function() {
			var bindCompleted = this.bindShopConfigModel();
			if (!bindCompleted) {
				return;
			}
			var selectCity = this.byId("selectCity");
			var cityId = selectCity.getSelectedItem().getBindingContext("city").getProperty("id");
			if (cityId) {
				this.filterDistrictByCity(cityId);
			}

		},

		onEditPressed: function(e) {
			var shopConfigModel = this.getModel("shopConfig");
			shopConfigModel.setProperty("/isEditing", true);
		},
		
		onCancelPressed: function() {
			this.bindShopConfigModel();
			var shopConfigModel = this.getModel("shopConfig");
			shopConfigModel.setProperty("/isEditing", false);
		},
		
		bindShopConfigModel: function() {
			var accountModel = this.getModel("account");
			if (!accountModel) {
				this.getRouter().navTo("login", true);
				return false;
			}
			var account = accountModel.getProperty("/");
			var model = this.getModel("shopConfig");
			if (!model) {
				model = new JSONModel();
				this.setModel(model, "shopConfig");
			}
			var shopConfig = {
				shop: account.shop
			};
			shopConfig.isEditing = false;
			model.setProperty("/", shopConfig);
			this.setLocationShop(shopConfig.shop.address.latitude, shopConfig.shop.address.longtitude);
			model.updateBindings(true);
			return true;
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
					that.postProcessUpdateAvatar(oEvt.data.link);
					// that.byId("carUploadedImg").addPage(
					//     new sap.m.Image({
					//         width: '80%',
					//         densityAware: false,
					//         decorative: false,
					//         src: encodeURI(oEvt.data.link)
					//     }));
					that.closeBusyDialog();
				},
				error: function(oEvt) {
					//Handle error here
					that.closeBusyDialog();
				}
			});
		},
		postProcessUpdateAvatar: function(avatarUrl) {
			var shopConfigModel = this.getModel("shopConfig");
			if (!shopConfigModel) {
				return;
			}
			var shopConfig = shopConfigModel.getProperty("/shop");
			var submitData = {
				shopId: shopConfig.id,
				shopName: shopConfig.shopName,
				facebook: shopConfig.facebook,
				email: shopConfig.email,
				phoneNumber: shopConfig.phoneNumber,
				addressId: shopConfig.address.id,
				policy: shopConfig.policy,
				address: shopConfig.address.fullAddress,
				districtId: shopConfig.address.districtId,
				longtitude: shopConfig.address.longtitude,
				latitude: shopConfig.address.latitude,
				avaUrl: avatarUrl,
				status: shopConfig.status
			};
			var result = models.postChangeShopInfo(submitData);
			if (result.result) {
				var accountModel = this.getModel("account");
				if (!accountModel) {
					accountModel = new JSONModel();
					this.getOwnerComponent().setModel(accountModel, "account");
				}
				accountModel.setProperty("/shop", result.response);
				accountModel.updateBindings(true);
				this.bindShopConfigModel();
				// MessageToast.show(this.getResourceBundle().getText("msgChangeInfoShopSuccessfully"));
				MessageBox.success("Cập nhật hình ảnh thành công!");
			} else {
				MessageBox.error("Thay đổi không thành công!");
			}
		},
		onDeletePic: function() {
			var that = this;
			var carousel = this.byId("carUploadedImg");
			var currentImage = carousel.getActivePage();
			var cI = sap.ui.getCore().byId(currentImage);
			var imgList = this.salesItemDialog.getModel("currentSalesItem").getProperty("/pictureList");
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
					success: function() {
						imgList.splice(index, 1);
						that.salesItemDialog.getModel("currentSalesItem").updateBindings(true);
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
				models.deleteImg(picData.id, picData.idCloud, callback);
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
		onSavePressed: function() {
			var shopConfigModel = this.getModel("shopConfig");
			if (!shopConfigModel) {
				return;
			}
			var shopConfig = shopConfigModel.getProperty("/shop");
			var submitData = {
				shopId: shopConfig.id,
				shopName: shopConfig.shopName,
				facebook: shopConfig.facebook,
				email: shopConfig.email,
				phoneNumber: shopConfig.phoneNumber,
				addressId: shopConfig.address.id,
				policy: shopConfig.policy,
				address: shopConfig.address.fullAddress,
				districtId: shopConfig.address.districtId,
				longtitude: shopConfig.address.longtitude,
				latitude: shopConfig.address.latitude,
				avaUrl: shopConfig.avatarUrl !== "" ? shopConfig.avatarUrl : "https://i.imgur.com/BF7JbOU.png",
				status: 4
			};
			var result = models.postChangeShopInfo(submitData);
			if (result.result) {
				var accountModel = this.getModel("account");
				if (!accountModel) {
					accountModel = new JSONModel();
					this.getOwnerComponent().setModel(accountModel, "account");
				}
				accountModel.setProperty("/shop", result.response);
				accountModel.updateBindings(true);
				var shopConfigModel = this.getModel("shopConfig");
				shopConfigModel.setProperty("/isEditing", false);
				shopConfigModel.updateBindings(true);
				// MessageToast.show(this.getResourceBundle().getText("msgChangeInfoShopSuccessfully"));
				MessageBox.success("Thay đổi thông tin Cửa hàng thành công! Quản trị viên sẽ cập nhật thông tin Cửa hàng của bạn!");
			}
		},
		onCityChanged: function(e) {
			var cityId = e.getParameter("selectedItem").getBindingContext("city").getProperty("id");
			this.filterDistrictByCity(cityId);
		},
		filterDistrictByCity: function(cityId) {
			var districts = models.getDistrictsByCity(cityId);
			var districtModel = this.getModel("district");
			if (!districtModel) {
				districtModel = new JSONModel();
				this.setModel(districtModel, "district");
			}
			districtModel.setProperty("/", districts);
			districtModel.updateBindings(true);
		},
		validatePhone: function() {
			var getId = this.getView().byId("ip_phone");
			var getValue = getId.getValue();

			var phoneRegex = /((09|03|07|08|05)+([0-9]{8})\b)/g;

			if (!phoneRegex.test(getValue)) {
				getId.setValueState(sap.ui.core.ValueState.Error);
				this.checkRegister = false;
			} else {
				getId.setValueState(sap.ui.core.ValueState.Success);
			}
		},

		getFullAddress: function() {
			var selectCity = this.byId("selectCity");
			var selectDistrict = this.byId("selectDistrict");
			var cityName = selectCity.getSelectedItem().getBindingContext("city").getProperty("cityName");
			var districtName = selectDistrict.getSelectedItem().getBindingContext("district").getProperty("districtName");
			var shopConfigModel = this.getModel("shopConfig");
			if (!shopConfigModel) {
				return;
			}
			var shopConfig = shopConfigModel.getProperty("/");
			var fullAddress = shopConfig.shop.address.fullAddress;
			if (districtName !== "") {
				fullAddress = fullAddress + ", " + districtName;
			}
			if (cityName !== "") {
				fullAddress = fullAddress + ", " + cityName;
			}
			return fullAddress;
		},

		getLocationFromInput: function() {
			this.clearMarker();
			var that = this;
			var geocoder = new google.maps.Geocoder();
			var fullAddress = this.getFullAddress();
			geocoder.geocode({
				'address': fullAddress
			}, function(results, status) {
				if (status === 'OK') {
					gMap.setCenter(results[0].geometry.location);
					gMap.setZoom(17);
					markers = new google.maps.Marker({
						map: gMap,
						position: results[0].geometry.location,
						draggable: true
					});
					that.setLatLngToModel(markers);
				} else {
					MessageBox.error("Địa chỉ bạn nhập chưa đúng!");
				}
			});
		},
		setLatLngToModel: function(marker) {
			var latLng = marker.position;
			var currentLatitude = latLng.lat();
			var currentLongitude = latLng.lng();
			this.getModel("shopConfig").setProperty("/shop/address/latitude", currentLatitude);
			this.getModel("shopConfig").setProperty("/shop/address/longtitude", currentLongitude);
		},

		clearMarker: function() {
			markers.setMap(null);
		},

		setLocationShop: function(lat, lng) {
			var that = this;
			var latLong = new google.maps.LatLng(lat, lng);
			if (!markers) {
				markers = new google.maps.Marker({
					position: latLong
				});
				markers.setMap(gMap);
			} else {
				markers.setPosition(latLong);
			}
			markers.setMap(gMap);
			gMap.setZoom(15);
			gMap.setCenter(markers.getPosition());
			google.maps.event.addListener(markers, 'dragend', function(marker) {
				var latLng = marker.latLng;
				var currentLatitude = latLng.lat();
				var currentLongitude = latLng.lng();
				that.getModel("shopConfig").setProperty("/shop/address/latitude", currentLatitude);
				that.getModel("shopConfig").setProperty("/shop/address/longtitude", currentLongitude);
			});
		},
		onAfterRendering: function() {
			if (!this.checkLogin()) {
				this.getRouter().navTo("login", true);
				return;
			}
			var mapOptions = {
				center: new google.maps.LatLng(0, 0),
				zoom: 1,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			gMap = new google.maps.Map(this.getView().byId("map_canvas").getDomRef(), mapOptions);
			this.initialModelBinding();
		}
	});
});