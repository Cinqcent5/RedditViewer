var baseLink = "http://www.reddit.com";
var lastFullname = "";
function sendRequest() {

    $("#loadingGif").show();
    $("#loadMoreButton").hide();

    var httprequest = new XMLHttpRequest();

    httprequest.open("GET", baseLink + "/.json?limit=30&after=" + lastFullname, true);
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
    var responseJSON = JSON.parse(responseText);
    var submissions = responseJSON.data.children;
    var currentColumn = 0;
    for (var i = 0; i < submissions.length; i++) {
        var data = submissions[i].data;
        var url = data.url;
        var permalink = data.permalink;
        var title = data.title;
        var fullname = submissions[i].kind + "_" + data.id;
        // Only display the link if it's a image
        if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            var containerHTML = "<ul class='imageContainer' onmouseover='displayOverlay(this,true)' onmouseout='displayOverlay(this,false)'>";
            var imageHTML = "<a class='imageLink' href=" + url + " target=_blank><img src=" + url + " width=" + width + "></a>";
            var overlayHTML = "<span class='imageOverlay'><a class='permalink' href=" + baseLink + permalink + " target=_blank>" + title + "</a></span>";
            document.getElementById("imageList" + currentColumn).innerHTML += containerHTML + imageHTML + overlayHTML + "</ul>";
            currentColumn = (currentColumn + 1) % 4;
        }
    }
    $("#loadingGif").hide();
    $("#loadMoreButton").show();

    //return the fullname of the last submission fetched
    var lastSubmission = submissions[submissions.length - 1];
    lastFullname = lastSubmission.kind + "_" + lastSubmission.data.id;
}

function displayOverlay(obj, show) {
    if (show) {
        obj.lastChild.style.display = 'block';
    } else {
        obj.lastChild.style.display = 'none';
    }
}