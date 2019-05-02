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
	var url = "model/transactionDetail.json";
	return BaseController.extend("mortgage.pawnshop.controller.Transaction", {
		formatter: formatter,
		onInit: function() {
			this.getRouter().getRoute("transaction").attachMatched(this._onObjectMatched, this);

		},
		_onObjectMatched: function(oEvent) {
			this.openPendingTrans();
			this.bindTransactionModel();
		},
		openPendingTrans: function() {
			var isPendingTrans = this.checkPassData("currentTransId");
			if (isPendingTrans) {
				var pendingTransId = this.consumePassData("currentTransId");
				this.displayTransactionDetail(pendingTransId);
			}
		},
		bindTransactionModel: function() {
			var accountModel = this.getModel("account");
			if (!accountModel) {
				this.getRouter().navTo("login", true);
				return;
			}
			var shopId = accountModel.getProperty("/shop/id");
			var data = models.getTransactions(shopId);
			var transModel = this.getModel("trans");
			if (!transModel) {
				transModel = new JSONModel();
				this.setModel(transModel, "trans");
			}
			transModel.setProperty("/", data);
		},
		onReset: function() { //Reset all filter
			//Clear all filters in filter bar
			var filterBar = this.byId("filterBar");
			if (filterBar) {
				var filterItems = filterBar.getFilterItems();
				if (filterItems) {
					for (var i = 0; i < filterItems.length; i++) {
						var filterControl = filterItems[i].getControl();
						filterControl.clearSelection();
						filterControl.fireSelectionFinish();

					}
				}
			}
		},
		onFilterByStatus: function(e) {
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
			var table = this.byId("tblTransaction");
			var bindingInfo = table.getBinding("items");
			if (bindingInfo) {
				bindingInfo.filter(filters);
			}
		},
		onFilterByItemCat: function(e) {
			var selectedItems = e.getParameter("selectedItems");
			if (!selectedItems) {
				selectedItems = [];
			}
			var filters = [];
			for (var i = 0; i < selectedItems.length; i++) {
				var filter = new Filter({
					path: "categoryItemId",
					operator: "EQ",
					value1: selectedItems[i].getKey()
				});
				filters.push(filter);
			}
			var table = this.byId("tblTransaction");
			var bindingInfo = table.getBinding("items");
			if (bindingInfo) {
				bindingInfo.filter(filters);
			}
		},

		onRefresh: function(e) {
			this.bindTransactionModel();
			e.getSource().hide();
		},
		onRegister: function(e) {
			this.getRouter().navTo("regPawnShop");
		},
		onCreateTransaction: function() {
			this.getRouter().navTo("creTrans");
		},
		onTransDetailPress: function(e) {
			//fetch detail data of transaction
			var transId = e.getSource().getBindingContext("trans").getProperty("id");
			this.displayTransactionDetail(transId);
		},
		displayTransactionDetail: function(transId) {
			var d = this.getTransactionDetail(transId);
			if (!this.TransDetailDialog) {
				this.TransDetailDialog = this.initFragment("mortgage.pawnshop.fragment.TransDetail", "transDetail");
			}
			//Data of Detail tab
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			if (!transDetailModel) {
				transDetailModel = new JSONModel(d);
				this.TransDetailDialog.setModel(transDetailModel, "transDetail");
			} else {
				transDetailModel.setProperty("/", d);
			}
			var nextPayDate = d.transaction.nextPaymentDate;
			//Data of payment Tab
			this.loadNewPaymentData(nextPayDate);
			this.TransDetailDialog.open();
		},
		onLiquidatePressed: function(e) {
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			if (!transDetailModel) {
				return;
			}
			var transDetailData = {
				transaction: transDetailModel.getProperty("/transaction"),
				pictureList: transDetailModel.getProperty("/pictureList")
			};
			this.setPassData("liquidate", transDetailData);
			this.TransDetailDialog.close();
			this.getRouter().navTo("sales", false);
		},
		onNextPaymentSubmit: function() {
			var busyTitle = this.getResourceBundle().getText("payment");
			this.openBusyDialog({
				title: busyTitle,
				showCancelButton: true
			});
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			if (!transDetailModel) {
				this.getRouter().navTo("login", true);
				return;
			}
			var transDetail = transDetailModel.getProperty("/");
			var nextPaymentModel = this.getModel("newPayment");
			if (!nextPaymentModel) {
				this.getRouter().navTo("login", true);
				return;
			}
			var nextPayment = nextPaymentModel.getProperty("/");
			nextPayment.paidDate.setHours(7);
			var data = {
				transactionId: transDetail.transaction.id,
				date: nextPayment.paidDate,
				description: nextPayment.description
			};
			var result = models.postNextPayment(data);
			if (result) {
				this.refreshTransDetail(transDetail.transaction.id);
			}
			this.closeBusyDialog();
		},
		onUploadPress: function(oEvt) {
			//fetch transDetail
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			if (!transDetailModel) {
				this.getRouter().navTo("login", true);
				return;
			}
			var transDetail = transDetailModel.getProperty("/");
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
				success: function(r) {
					var data = {
						idCloud: r.data.id,
						deleteHash: r.data.deletehash,
						picUrl: r.data.link,
						objId: transDetail.transaction.id,
						type: 1
					};
					models.addImg(data);
					that.refreshTransDetail(transDetail.transaction.id);
					transDetailModel.updateBindings(true);
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
			var imgList = this.TransDetailDialog.getModel("transDetail").getProperty("/pictureList");
			var context = cI.getBindingContext("transDetail");
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
						that.TransDetailDialog.getModel("transDetail").updateBindings(true);
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
				var svDeleted = models.deleteImg(picData.id, picData.idCloud, callback);
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
			xhr.setRequestHeader("Content-type", file.type + ",application/json"); //"application/x-www-form-urlencoded");
			xhr.setRequestHeader("Authorization", "Client-ID 5c25e781ffc7f495059078408c311799e277d70e"); //"application/x-www-form-urlencoded");
			xhr.setRequestHeader("access-control-allow-headers", "*"); //"application/x-www-form-urlencoded");
			var data = base64string;
			xhr.send(data);
		},

		refreshTransDetail: function(transId) {
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			if (!transDetailModel) {
				return;
			}
			var transDetailData = models.getTransactionDetail(transId);
			transDetailModel.setProperty("/", transDetailData);
			transDetailModel.updateBindings(true);
		},
		loadNewPaymentData: function(nextPaymentDate) {
			var newPayment = this.getModel("newPayment");
			if (!newPayment) {
				newPayment = new JSONModel();
				this.setModel(newPayment, "newPayment");
			}
			var data = {
				paidDate: new Date(),
				description: ""
			};
			newPayment.setProperty("/", data);
		},
		onActionPressed: function() {
			var txtDesc = this.byId("txtActionDesc");
			var selectAction = this.byId("selectAction");
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			if (!transDetailModel) {
				this.getRouter().navTo("login", true);
				return;
			}
			var transDetail = transDetailModel.getProperty("/");
			var submitData = {
				transactionId: transDetail.transaction.id,
				description: txtDesc.getValue()
			};
			var result = false;
			switch (selectAction.getSelectedKey()) {
				case "1":
					{
						result = models.postRedeem(submitData);
						break;
					}
				case "2":
					{
						result = models.postCancel(submitData);
						break;
					}
				case "3":
					{
						result = this.doReplaceTransaction();
						break;
					}
				default:
					return;
			}
			if (result) {
				MessageToast.show(this.getResourceBundle().getText("msgRedeemdSuccessfully"));
				this.bindTransactionModel();

			}
		},
		doReplaceTransaction: function() {
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			var transData = transDetailModel.getProperty("/");
			var passed = this.setPassData("replacedTrans", transData);
			if (passed) {
				this.getRouter().navTo("creTrans", false);
				this.TransDetailDialog.close();
			}
		},
		//load detail of transaction by transaction Id: d = transId
		getTransactionDetail: function(transId) { //TransId: Mã HD
			var d = models.getTransactionDetail(transId);
			//process d for further usage.
			var attributes = d.transactionItemAttributes;
			for (var i = 0; i < attributes.length; i++) {
				if (attributes[i].attributeName) {
					d["attr" + (i + 1) + "name"] = attributes[i].attributeName;
					d["attr" + (i + 1) + "value"] = attributes[i].attributeValue;
				}
			}

			return d;
		},
		onTransEditPressed: function(e) {
			this.TransDetailDialog.getModel().setProperty("/editMode", true);
		},

		onDownloadFile: function() {
			var transDetailModel = this.TransDetailDialog.getModel("transDetail");
			var data = transDetailModel.getData();
			var dataTrans = data.transaction;
			var infoPawner = dataTrans.pawneeInfo;
			var accountModel = this.getModel("account");
			var getShop = accountModel.getData();
			var shopInfo = getShop.shop;
			console.log(shopInfo, infoPawner, dataTrans, data);
			var apiEndpoint = "https://selectpdf.com/api2/convert/";
			var apiKey = "6268a108-1680-43b6-833a-befada064d60";

			var urlHref = "<div class=\"post-content entry-content\" id=\"doc-content\">\n" +
				"    <p style=\"text-align:center\">--------------------------------------------------------------------------- </p>\n" +
				"\n" +
				"    <p style=\"margin-left:-7.1pt; text-align:center\"><strong><span style=\"color:#000000\"><span style=\"font-size:14px\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span></span></strong></p>\n" +
				"\n" +
				"    <p style=\"margin-left:-7.1pt; text-align:center\"><span style=\"color:#000000\"><span style=\"font-size:14px\">Độc lập - Tự do - Hạnh phúc</span></span></p>\n" +
				"\n" +
				"    <p style=\"text-align:center\"><span style=\"color:#000000\"><span style=\"font-size:14px\">-----------------------------</span></span></p>\n" +
				"\n" +
				"    <p style=\"margin-left:-35.45pt; text-align:center\"> </p>\n" +
				"\n" +
				"    <h2 style=\"text-align:center\"><span style=\"font-family:arial,helvetica,sans-serif\"><span style=\"color:rgb(0, 0, 0)\"><span style=\"font-size:14px\"><strong>HỢP ĐỒNG CẦM CỐ TÀI SẢN</strong></span></span></span></h2>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>Bên cầm cố tài sản (sau đây gọi là bên A): </strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">Ông<em>(Bà</em><em>)</em>: " + infoPawner.name +
				"</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">Chứng minh nhân dân số:" + infoPawner.identityNumber +
				"</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">Hộ khẩu thường trú <em>(truờng hợp không có hộ khẩu thường trú, thì ghi Đăng ký tạm trú)</em>:" +
				infoPawner.address + "</span></span></p>\n" +
				"\n" +
				"    <h3><span style=\"color:#000000\"><span style=\"font-size:14px\">Bên nhận cầm cố tài sản (sau đây gọi là bên B):</span></span></h3>\n" +
				"\n" +
				"    <h3><span style=\"color:#000000\"><span style=\"font-size:14px\"><em>(Chọn một trong các chủ thể nêu trên)</em></span></span></h3>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">:" + shopInfo.shopName + "</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">Hai bên đồng ý thực hiện việc cầm cố tài sản với những thoả thuận sau đây:</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 1</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>NGHĨA VỤ ĐƯỢC BẢO ĐẢM</strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Bên A đồng ý cầm cố tài sản thuộc quyền sở hữu của mình để bảo đảm thực hiện nghĩa vụ trả nợ cho bên B (bao gồm: nợ gốc, lãi vay, lãi quá hạn và phí).</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Số tiền mà bên B cho bên A vay là: " + dataTrans.basePrice +
				" VND.</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">Các điều kiện chi tiết về việc cho vay số tiền nêu trên đã được ghi cụ thể trong Hợp đồng tín dụng.</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 2</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>TÀI SẢN CẦM CỐ</strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Tài sản cầm cố là " + dataTrans.itemName +
				"<em>,</em> có đặc điểm như sau:</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Theo, " + data.attr1name + ": " + data.attr1value +
				"</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">" + data.attr2name + ": " + data.attr2value +
				"</em></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">" + data.attr3name + ": " + data.attr3value +
				"</em></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">" + data.attr4name + ": " + data.attr4value +
				"</em></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">thì bên A là chủ sở hữu của tài sản cầm cố nêu trên<em>.</em></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">3. Hai bên thỏa thuận tài sản cầm cố sẽ do Bên B giữ.</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 3 </strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>GIÁ TRỊ TÀI SẢN CẦM CỐ</strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Giá trị của tài sản cầm cố nêu trên là:" + dataTrans.basePrice +
				" VND.</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Việc xác định giá trị của tài sản cầm cố nêu trên chỉ để làm cơ sở xác định mức cho vay của bên B, không áp dụng khi xử lý tài sản để thu hồi nợ. </span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 4</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>NGHĨA VỤ VÀ QUYỀN CỦA BÊN A </strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Nghĩa vụ của bên A:</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Giao tài sản cầm cố  nêu trên cho bên B theo đúng thoả thuận; nếu có giấy tờ chứng nhận quyền sở hữu tài sản cầm cố, thì phải giao cho bên B bản gốc giấy tờ đó, trõ trường hợp có thoả thuận khác;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Báo cho bên B về quyền của người thứ ba đối với tài sản cầm cố, nếu có;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">          - Đăng ký việc cầm cố nều tài sản cầm cố phải đăng ký quyền sở hữu theo quy định của pháp luật;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Thanh toán cho bên B chi phí cần thiết để bảo quản, giữ gỡn tài sản cầm cố, trõ trường hợp có thoả thuận khác;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">          -Trong trường hợp vẫn giữ tài sản cầm cố, thì phải bảo quản, khụng được bán, trao đổi, tặng cho, cho thuê, cho mượn và chỉ được sử dụng tài sản cầm cố, nếu được sự đồng ý của bên B; nếu do sử dụng mà tài sản cầm cố có nguy cơ bị mất giá trị  hoặc giảm sút giá trị, thì bên A khụng được tíêp tục sử dụng theo yêu cầu của bên B;</span></span></p>\n" +
				"\n" +
				"    <p style=\"margin-left:28.35pt\"> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Quyền của bên A</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Yêu cầu bên B đình chỉ việc sử dụng tài sản cầm cố, nếu do sử dụng mà tài sản cầm cố có nguy cơ bị mất giá trị hoặc giảm giá trị;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Yêu cầu bên B giữ tài sản cầm cố hoặc người thứ ba giữ tài sản cầm cố hoàn trả tài sản cầm cố sau khi nghĩa vụ  đó được thực hiện; nếu bên B chỉ nhận giấy tờ chứng nhận quyền sở hữu tài sản cầm cố, thì yờu cầu hoàn trả giấy tờ đó;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Yêu cầu bên B giữ tài sản cầm cố hoặc người thứ ba giữ tài sản cầm cố bồi thường thiệt hại xảy ra đối với tài sản cầm cố hoặc các giấy tờ về tài sản cầm cố.</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 5</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>NGHĨA VỤ VÀ QUYỀN CỦA BÊN B </strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Nghĩa vụ của bên B :</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Giữ gỡn, bảo quản tài sản cầm cố và các giấy tờ về tài sản cầm cố nêu trên, trong trường hợp làm mất, hư hỏng, thì phải bồi thường thiệt hại cho bên A;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Không được bán, trao đổi, tặng cho, cho thuê, cho mượn hoặc dùng tài sản cầm cố để bảo đảm cho nghĩa vụ khác;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Khụng được khai thác  công dụng, hưởng hoa lợi, lợi tức từ tài sản cầm  cố, nếu không được bên A đồng ý;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Trả lại tài sản cầm cố và các giấy tờ về tài sản cầm cố nêu trên cho bên A khi nghĩa vụ bảo đảm bằng cầm cố chấm dứt hoặc được thay thế bằng biện pháp bảo đảm khác.</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Quyền của bên B</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Yêu cầu người chiếm hữu, sử dụng  trái pháp luật tài sản cầm cố hoàn trả tài sản đó;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Yêu cầu bên A thực hiện đăng ký việc cầm cố, nếu tài sản cầm cố phải đăng ký quyền sở hữu  theo quy định của pháp luật.</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Yêu cầu xử lý tài sản cầm cố theo phương thức đó thoả thuận hoặc theo quy định của pháp luật để thực hiện nghĩa vụ, nếu bên A không thực hiện hoặc thực hiện không đúng nghĩa vụ;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Được khai thác công dụng tài sản cầm cố và hưởng hoa lợi, lợi tức từ tài sản cầm cố, nếu có thoả thuận;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Được thanh toán chi phí hợp lý bảo quản tài sản cầm cố khi trả lại tài sản cho bên A.</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 6</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>XỬ LÝ TÀI SẢN CẦM CỐ</strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Trong trường hợp hết thời hạn thực hiện nghĩa vụ trả nợ mà bên A không trả hoặc trả không hết nợ, thì bên B có quyền yêu cầu xử lý tài sản cầm cố nêu trên theo quy định của pháp luật để thu hồi nợ với phương thức:</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><em>Chọn một hoặc một số phương thức sau đây:</em></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Bán đấu giá tài sản cầm cố</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Bên B nhận chính tài sản cầm cố để thay thế cho việc thực hiện nghĩa vụ được bảo đảm</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">- Bên B được nhận trực tiếp các khoản tiền hoặc tài sản từ bên thứ ba trong trường hợp bên thứ ba có nghĩa vụ trả tiền hoặc tài sản cho bên A</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Việc xử lý tài sản cầm cố nêu trên được thực hiện để thanh toán cho bên B theo thứ tự nợ gốc, lãi vay, lãi quá hạn, các khoản phí khác (nếu có), sau khi đã trõ đi các chi phí bảo quản, chi phí bán đấu giá và các chi phí khác có liên quan đến việc xử lý tài sản cầm cố.</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 7</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>PHƯƠNG THỨC GIẢI QUYẾT TRANH CHẤP HỢP ĐỒNG</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">         </span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">          Trong quá trình thực hiện hợp đồng, nếu phát sinh tranh chấp, các bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn trọng quyền lợi của nhau; trong trường hợp không giải quyết được, thì một trong hai bên có quyền khởi kiện để yêu cầu toà án có thẩm quyền giải quyết theo quy định của pháp luật.</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 8</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>CAM</strong><strong> ĐOAN CỦA CÁC BÊN</strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">Bên A và bên B chịu trách nhiệm trước pháp luật về những lời cam đoan sau đây:</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Bên A cam đoan:</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">a. Những thông tin về nhân thân và về tài sản cầm cố đã ghi trong hợp đồng này là đúng sự thật;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">b. Tài sản cầm cố nêu trên không có tranh chấp;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">c. Tài sản cầm cố không bị cơ quan nhà nước có thẩm quyền xử lý theo quy định pháp luật;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">d. Việc giao kết hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">e. Thực hiện đúng và đầy đủ tất cả các thoả thuận đã ghi trong Hợp đồng này;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">g. Các cam đoan khác…</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Bên B cam đoan:</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">a. Những thông tin về nhân thân đã ghi trong Hợp đồng này là đúng sự thật;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">b. Đã xem xét kỹ, biết rõ về tài sản cầm cố nêu trên và các giấy tờ về tài sản cầm cố, đồng ý cho bên A vay số tiền nêu tại Điều 1 của Hợp đồng này; </span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">c. Việc giao kết hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">d. Thực hiện đúng và đầy đủ tất cả các thoả thuận đã ghi trong Hợp đồng này;</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">e. Các cam đoan khác…</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">                                                                                       </span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU 10</strong></span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>ĐIỀU KHOẢN CUỐI CÙNG</strong></span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">1. Hai bên công nhận đã hiểu rõ quyền, nghĩa vụ và lợi ích hợp pháp của mình, ý nghĩa và hậu quả pháp lý của việc giao kết hợp đồng này.</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">         </span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">2. Hai bên đã đọc Hợp đồng, đã hiểu và đồng ý tất cả các điều khoản ghi trong Hợp đồng và ký vào Hợp đồng này.</span></span></p>\n" +
				"\n" +
				"    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">3. Hợp đồng này có hiệu lực kể từ " + data.startDate +
				"</span></span></p>\n" +
				"\n" +
				"    <p> </p>\n" +
				"\n" +
				"    <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\">\n" +
				"        <tbody>\n" +
				"            <tr>\n" +
				"                <td style=\"height:51px; width:329px\">\n" +
				"                    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>Bên A</strong></span></span></p>\n" +
				"\n" +
				"                    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"> (<em>ký, điểm chỉ và ghi rõ họ tên</em>)</span></span></p>\n" +
				"                </td>\n" +
				"                <td style=\"height:51px; width:312px\">\n" +
				"                    <p><span style=\"color:#000000\"><span style=\"font-size:14px\"><strong>Bên B</strong></span></span></p>\n" +
				"\n" +
				"                    <p><span style=\"color:#000000\"><span style=\"font-size:14px\">(<em>ký, đóng dấu và ghi rõ họ tên</em>)</span></span></p>\n" +
				"                </td>\n" +
				"            </tr>\n" +
				"        </tbody>\n" +
				"    </table>\n" +
				"</div>\n"; // current page

			var params = {
				key: apiKey,
				html: urlHref
			};

			var xhr = new XMLHttpRequest();
			xhr.open('POST', apiEndpoint, true);
			xhr.setRequestHeader("Content-Type", "application/json");

			xhr.responseType = 'arraybuffer';

			xhr.onload = function(e) {
				if (this.status == 200) {
					//console.log('Conversion to PDF completed ok.');

					var blob = new Blob([this.response], {
						type: 'application/pdf'
					});
					var urlPage = window.URL || window.webkitURL;
					var fileURL = urlPage.createObjectURL(blob);
					//window.location.href = fileURL;

					//console.log('File url: ' + fileURL);

					var fileName = "Document.pdf";

					if (navigator.appVersion.toString().indexOf('.NET') > 0) {
						// This is for IE browsers, as the alternative does not work
						window.navigator.msSaveBlob(blob, fileName);
					} else {
						// This is for Chrome, Firefox, etc.
						var a = document.createElement("a");
						document.body.appendChild(a);
						a.style = "display: none";
						a.href = fileURL;
						a.download = fileName;
						a.click();
					}
				} else {
					//console.log("An error occurred during conversion to PDF: " + this.status);
					console.log("An error occurred during conversion to PDF.\nStatus code: " + this.status + ", Error: " + String.fromCharCode.apply(
						null, new Uint8Array(this.response)));
				}
			};

			xhr.send(JSON.stringify(params));
		}
	});
});