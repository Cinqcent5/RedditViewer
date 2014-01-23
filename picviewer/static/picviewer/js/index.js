var base_link = "http://www.reddit.com/";
var lastFullname = "";
function sendRequest() {

    $("#loadingGif").show();
    $("#loadMoreButton").hide();

    var httprequest = new XMLHttpRequest();

    httprequest.open("GET", base_link + ".json?limit=30&after=" + lastFullname, true);
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
    for (var i = 0; i < submissions.length; i++) {
        var url = submissions[i].data.url;
        // Only display the link if it's a image
        if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            var imageHTML = "<a class='imageLink' href=" + url + " target=_blank><img src=" + url + " width=" + width + "></a>";
            document.getElementById("gallery").innerHTML += imageHTML;
        }
    }
    $("#loadingGif").hide();
    $("#loadMoreButton").show();

    //return the fullname of the last submission fetched
    var lastSubmission = submissions[submissions.length - 1];
    lastFullname = lastSubmission.kind + "_" + lastSubmission.data.id;

}
