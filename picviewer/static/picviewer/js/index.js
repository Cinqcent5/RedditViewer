var baseLink = "http://www.reddit.com";
var lastFullname = "";
function sendRequest(subreddit) {
    $("#loadingGif").show();
    $("#loadMoreButton").hide();

    var httprequest = new XMLHttpRequest();
    var link;
    if (subreddit != '') {
        link = baseLink + "/r/" + encodeURIComponent(subreddit) + "/.json?limit=30&after=" + lastFullname;
    } else {
        link = baseLink + "/.json?limit=25&after=" + lastFullname;
    }
    httprequest.open("GET", link, true);
    httprequest.send();
    httprequest.onreadystatechange = stateChangeHandlers;
}

function stateChangeHandlers() {
    if (this.readyState == 4) {
        if (this.status == 200) {
            parseJSON(this.responseText);
        } else {
            alert("Connection Error\nStatus code: " + this.status + "\n" + this.responseText);
        }
        $("#loadingGif").hide();
        $("#loadMoreButton").show();
    }
}

function parseJSON(responseText) {
    var width = 350;
    var responseJSON = JSON.parse(responseText);
    var submissions = responseJSON.data.children;
    var currentColumn = 0;
    for (var i = 0; i < submissions.length; i++) {
        var data = submissions[i].data;
        var permalink = data.permalink;
        var title = data.title;
        var fullname = submissions[i].kind + "_" + data.id;

        var url = data.url;
        var thumbUrl = url;

        var isPicture = false;
        var match;
        if (( match = url.match(/(i\.imgur\.com\/[A-z0-9]{5,7})(\.(jpeg|jpg|gif|png|bmp))$/)) != null) {
            // if it's an direct image url from imgur, we can limit the image size to 640x640
            // by adding 'l' to the end of the file hash
            thumbUrl = "http://" + match[1] + "l" + match[2];
            isPicture = true;
        } else if (( match = url.match(/imgur\.com\/([A-z0-9]{5,7})$/)) != null) {
            // if it's an imgur url in the form of  imgur.com/xxxxxxx , there will be a picture at
            // i.imgur.com/xxxxxxxl.jpg that can be used for thumbnail
            thumbUrl = "http://i.imgur.com/" + match[1] + "l.jpg";
            isPicture = true;
        } else if (url.match(/\.(jpeg|jpg|gif|png|bmp)$/) != null) {
            isPicture = true;
        }
        // Only display the link if it's a image
        if (isPicture) {
            var containerHTML = "<ul class='imageContainer' id='" + fullname + "' onmouseover='displayOverlay(this,true)' onmouseout='displayOverlay(this,false)'>";
            var imageHTML = "<a class='imageLink' href=" + url + " target=_blank><img class='image' src=" + thumbUrl + " width=" + width + "></a>";
            var overlayHTML = "<span class='imageOverlay'><a class='permalink' href=" + baseLink + permalink + " target=_blank>" + title + "</a></span>";
            document.getElementById("imageList" + currentColumn).innerHTML += containerHTML + imageHTML + overlayHTML + "</ul>";
            currentColumn = (currentColumn + 1) % 4;
        }
    }

    //return the fullname of the last submission fetched
    var lastSubmission = submissions[submissions.length - 1];
    lastFullname = lastSubmission.kind + "_" + lastSubmission.data.id;
}

// Toggles the image overlay (title, comment link, etc) when the mouse
// hovers over and when it moves out
function displayOverlay(obj, show) {
    if (show) {
        obj.lastChild.style.display = 'block';
    } else {
        obj.lastChild.style.display = 'none';
    }
}