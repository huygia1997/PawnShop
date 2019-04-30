function postRequest() {
    var requestMessage;
    var responseMessage;
    var endPointWSDL;


    requestMessage = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">';
    requestMessage = requestMessage.concat("<soapenv:Header/>");
    requestMessage = requestMessage.concat("<soapenv:Body>");
    requestMessage = requestMessage.concat(" <tem:CalcPrecoPrazo>");
    requestMessage = requestMessage.concat("<tem:nCdEmpresa>49436</tem:nCdEmpresa>");
    requestMessage = requestMessage.concat("<tem:sDsSenha></tem:sDsSenha>");
    requestMessage = requestMessage.concat("<tem:nCdServico>40010</tem:nCdServico>");
    requestMessage = requestMessage.concat("<tem:sCepOrigem>05422030</tem:sCepOrigem>");
    requestMessage = requestMessage.concat("<tem:sCepDestino>06026090</tem:sCepDestino>");
    requestMessage = requestMessage.concat("<tem:nVlPeso>1</tem:nVlPeso>");
    requestMessage = requestMessage.concat("<tem:nCdFormato>3</tem:nCdFormato>");
    requestMessage = requestMessage.concat("<tem:nVlComprimento>20.00</tem:nVlComprimento>");
    requestMessage = requestMessage.concat("<tem:nVlAltura>0</tem:nVlAltura>");
    requestMessage = requestMessage.concat("<tem:nVlLargura>12.00</tem:nVlLargura>");
    requestMessage = requestMessage.concat("<tem:nVlDiametro>0</tem:nVlDiametro>");
    requestMessage = requestMessage.concat("<tem:sCdMaoPropria>N</tem:sCdMaoPropria>");
    requestMessage = requestMessage.concat("<tem:nVlValorDeclarado>0</tem:nVlValorDeclarado>");
    requestMessage = requestMessage.concat("<tem:sCdAvisoRecebimento>N</tem:sCdAvisoRecebimento>");
    requestMessage = requestMessage.concat("</tem:CalcPrecoPrazo>");
    requestMessage = requestMessage.concat("</soapenv:Body>");
    requestMessage = requestMessage.concat("</soapenv:Envelope>");
    responseMessage = "";
    endPointWSDL = "http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx?WSDL";
}

//on press button:
function callWebService() {

    var textArea = new sap.ui.commons.TextArea({id: "textArea1"});

    function uicontrols() {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(responseMessage, "text/xml");
        var returnVal = xmlDoc.getElementsByTagName("Servicos")[0].childNodes[0].nodeValue;
        textArea.setValue(returnVal); //set the value to textArea
    }

    $.ajax({
        url: endPointWSDL,
        type: "POST",
        data: requestMessage,
        dataType: "text",
        contentType: "text/xml; charset=\"utf-8\"",
        success: function (data, textStatus, jqXHR) {
            responseMessage = data;
        },
        error: function (xhr, status) {
            sap.ui.commons.MessageBox.alert("Error to consume WebService");
        },
        complete: function (xhr, status) {
            uicontrols();
        }
    });

}

