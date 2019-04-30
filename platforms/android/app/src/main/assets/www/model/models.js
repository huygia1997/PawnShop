sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";
    const serverInfo = {
        // url: "http://192.168.2.78:8080", //máy HuyTG
        url: "https://backend-mortgage.dfksoft.com/new", //Server DFK
        localUrl: "model",
        useLocal: false
    };
    return {

        getServerInfo: function () {
            return serverInfo;
        },

        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        createGlobalModel: function () {
            return new JSONModel({
                "user": "",
                "currencyCode": "VND",
                "name": "",
                "token": "none",
                "accountId": "",
                "appTitleIcon": "sap-icon://home"
            });
        },
        getTransactions: function (shopId) {
            var data = [];
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/transaction.json";
            } else {
                url = serverInfo.url + "/cam-do";
            }
            var ajaxData = {
                shopId: shopId
            };
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: ajaxData,
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {

                }

            });
            return data;
        },
        getDashboard: function (shopId) {
            var data = [];
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/dashboard.json";
            } else {
                url = serverInfo.url + "/dashboard";
            }
            var ajaxData = {
                shopId: shopId
            };
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: ajaxData,
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {

                }

            });
            return data;
        },
        getNotifications: function (accountId) {
            var data = [];
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/notification.json";
            } else {
                url = serverInfo.url + "/get-new-notification";
            }
            var ajaxData = {
                id: accountId
            };
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: ajaxData,
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {

                }

            });
            return data;
        },
        postCreateTransaction: function (data) {

            var returnCallback = {
                result: false,
                response: null
            };
            var onSuccess = function (res, status, xhr) {

                },
                onError = function (jqXHR, textStatus, errorThrown) {
                    //Mock-backend test login

                    // that._LoginDialog.getModel("loginResult").setProperty("/failed", true);
                    // console.log("Got an error response: " + textStatus + errorThrown);
                    // //Off-Busy after proceed
                };
            var serverInfo = this.getServerInfo();
            var url = "",
                method = "POST";
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/account.json";
            } else {
                url = serverInfo.url + "/tao-hop-dong";
            }

            $.ajax({
                data: data,
                url: url,
                type: method,
                async: false,
                //end-local
                dataType: "json",
                context: this,
                success: function (res, status, xhr) {
                    returnCallback.result = true;
                    returnCallback.response = res;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //Mock-backend test login
                    returnCallback.result = null;
                    // that._LoginDialog.getModel("loginResult").setProperty("/failed", true);
                    // console.log("Got an error response: " + textStatus + errorThrown);
                    // //Off-Busy after proceed
                }
            });
            return returnCallback;
        },
        postChangeShopInfo: function (data) {

            var returnCallback = {
                result: false,
                response: null
            };
            var onSuccess = function (res, status, xhr) {

                },
                onError = function (jqXHR, textStatus, errorThrown) {
                    //Mock-backend test login

                    // that._LoginDialog.getModel("loginResult").setProperty("/failed", true);
                    // console.log("Got an error response: " + textStatus + errorThrown);
                    // //Off-Busy after proceed
                };
            var serverInfo = this.getServerInfo();
            var url = "";
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/account.json";
            } else {
                url = serverInfo.url + "/thay-doi-thong-tin-cua-hang";
            }
            $.ajax({
                data: data,
                url: url,
                async: false,
                //end-local
                dataType: "json",
                type: "PUT",
                context: this,
                success: function (res, status, xhr) {
                    returnCallback.result = true;
                    returnCallback.response = res;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //Mock-backend test login
                    returnCallback.result = null;
                    // that._LoginDialog.getModel("loginResult").setProperty("/failed", true);
                    // console.log("Got an error response: " + textStatus + errorThrown);
                    // //Off-Busy after proceed
                }
            });
            return returnCallback;
        },
        demoSendNoti: function () {

            var returnCallback = {
                result: false,
                response: null
            };
            var onSuccess = function (res, status, xhr) {

                },
                onError = function (jqXHR, textStatus, errorThrown) {
                    //Mock-backend test login

                    // that._LoginDialog.getModel("loginResult").setProperty("/failed", true);
                    // console.log("Got an error response: " + textStatus + errorThrown);
                    // //Off-Busy after proceed
                };
            var serverInfo = this.getServerInfo();
            var url = "";
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/account.json";
            } else {
                url = serverInfo.url + "/check-scheduled";
            }
            $.ajax({
                url: url,
                async: false,
                //end-local
                dataType: "json",
                type: "GET",
                context: this,
                success: function (res, status, xhr) {
                    returnCallback.result = true;
                    // returnCallback.response = res;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //Mock-backend test login
                    returnCallback.result = null;
                    // that._LoginDialog.getModel("loginResult").setProperty("/failed", true);
                    // console.log("Got an error response: " + textStatus + errorThrown);
                    // //Off-Busy after proceed
                }
            });
            return returnCallback;
        },
        getCateConfigSet: function (shopId) {
            var data = [];
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/categoryConfig.json";
            } else {
                url = serverInfo.url + "/danh-muc";
            }
            var ajaxData = {
                shopId: shopId
            };
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: ajaxData,
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {

                }

            });
            return data;
        },

        postCateConfigSet: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/tao-cau-hinh-danh-muc";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        updateCateConfigSet: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/chinh-sua-cau-hinh-danh-muc";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'PUT',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        changeStatusCateConfig: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/thay-doi-trang-thai-cau-hinh-danh-muc";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'PUT',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        getCategorySet: function () {
            var data = [];
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/category.json";
            } else {
                url = serverInfo.url + "/get-all-category";
            }
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {

                }

            });
            return data;
        },
        getPawneeInfo: function (email, shopId) {
            var data = [];
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/pawneeInfo.json";
            } else {
                url = serverInfo.url + "/checkExistPawnee";
            }
            var ajaxData = {
                email: email,
                shopId: shopId
            };
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: ajaxData,
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {

                }

            });
            return data;
        },

        getTransactionDetail: function (transId) {
            var data = [];
            var url = "";
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/transaction.json";
            } else {
                url = serverInfo.url + "/phieu-cam-do";
            }
            var ajaxData = {
                transId: transId
            };
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: ajaxData,
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {
                }
            });
            return data;
        },
        getSalesItems: function (shopid) {
            var data = [];
            var url = "";
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/salesItems.json";
            } else {
                url = serverInfo.url + "/san-pham";
            }
            var ajaxData = {
                shopId: shopid
            };
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: ajaxData,
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                },
                error: function (e) {
                }
            });
            return data;
        },
        postNextPayment: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/tra-lai";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        postCreateSalesItem: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/tao-san-pham";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        updateSalesItem: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/chinh-sua-san-pham";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'PUT',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        changeSalesItem: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/thay-doi-trang-thai-san-pham";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        postLiquidate: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/thanh-ly-phieu-cam-do";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        postRedeem: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/chuoc-do";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        postCancel: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/dong-hop-dong";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },

        addImg: function (data) {
            var url;
            if (serverInfo.useLocal) {
                return true;
            } else {
                url = serverInfo.url + "/them-anh";
            }
            var returnCallback = false;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                data: data,
                method: 'POST',
                async: false,
                success: function (d, r, xhr) {
                    data = d;
                    returnCallback = true;
                },
                error: function (e) {

                }

            });
            return returnCallback;
        },
        deleteImg: function (picId, picCloudId, callback) {
            var xhr = new XMLHttpRequest();
            var callbackParam = false;
            xhr.onreadystatechange = function (ev) {
                if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 201)) {
                    if (picId) {
                        callbackParam = deleteImgOnServer();
                    }
                    callback.success();
                } else if (xhr.readyState == 4) {
                    callbackParam = false;
                    callback.error();
                }
            };
            var URL = "https://api.imgur.com/3/image/" + picCloudId;
            xhr.open('DELETE', URL, true);
            xhr.setRequestHeader("Authorization", "Bearer 5c25e781ffc7f495059078408c311799e277d70e");//"application/x-www-form-urlencoded");
            xhr.send();

            var deleteImgOnServer = function () {
                var url;
                if (serverInfo.useLocal) {
                    return true;
                } else {
                    url = serverInfo.url + "/xoa-anh";
                }
                var returnCallback = false;
                var data = {
                    picId: picId
                };
                $.ajax({
                    url: url,
                    context: this,
                    dataType: 'json',
                    data: data,
                    method: 'DELETE',
                    async: false,
                    success: function (d, r, xhr) {
                        returnCallback = true;
                    },
                    error: function (e) {

                    }

                });
                return returnCallback;
            }
        },
        getCities: function () {
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/city.json";
            } else {
                url = serverInfo.localUrl + "/city.json"; // N/A Yet
            }
            var returnCallback = null;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                method: 'GET',
                async: false,
                success: function (d, r, xhr) {
                    returnCallback = d;
                },
                error: function (e) {
                    return null;
                }

            });
            return returnCallback;
        },
        getDistricts: function () {
            var url;
            if (serverInfo.useLocal) {
                url = serverInfo.localUrl + "/district.json";
            } else {
                url = serverInfo.localUrl + "/district.json"; // N/A Yet
            }
            var returnCallback = null;
            $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                method: 'GET',
                async: false,
                success: function (d, r, xhr) {
                    returnCallback = d;
                },
                error: function (e) {
                    return null;
                }

            });
            return returnCallback;
        },
        getDistrictsByCity: function (cityId) {
            var districts = this.getDistricts();
            var filteredDistrict = [];
            districts.forEach(function (district, index) {
                if (district.cityId === cityId) {
                    filteredDistrict.push(district);
                }
            });
            // for (var district in districts) {
            //     if (district.cityId === cityId) {
            //         filteredDistrict.push(district);
            //     }
            // }
            return filteredDistrict;
        }
    };
});
