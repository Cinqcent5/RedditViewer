var base_link = "http://www.reddit.com/";
function sendRequest() {
    var httprequest = new XMLHttpRequest();
    httprequest.open("GET", base_link + ".json", true);
    httprequest.send();
    httprequest.onreadystatechange = stateChangeHandlers;
}

function stateChangeHandlers() {
    if (this.readyState == 4) {
        if (this.status == 200) {
            parseJSON(this.responseText);
        } else {
            document.write("Connection Error");
        }
    }
}

function parseJSON(responseText) {
    var width = 350;
    var maxWidth = window.screen.width - 100;
    var maxColumns = Math.floor(maxWidth / (width + 20));
    var currentColumn = 0;
    var responseJSON = JSON.parse(responseText);
    var submissions = responseJSON.data.children;
    for (var i = 0; i < submissions.length; i++) {
        var url = submissions[i].data.url;
        // Only display the link if it's a image
        if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            var imageHTML = "<a class='imageLink' href=" + url + " target=_blank><img src=" + url + " width=" + width + "></a>";
            if (currentColumn > maxColumns) {
                imageHTML += "<br/>";
                currentColumn=0;
            }
            document.body.innerHTML += imageHTML;
            currentColumn = currentColumn + 1;
        }
    }
}
