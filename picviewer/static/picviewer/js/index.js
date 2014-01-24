var baseLink = "http://www.reddit.com";
var lastFullname = "";
var pendingRequest = false;
var subredditSearchRequest;
var minCol = -1;
function sendRequest(subreddit) {
    pendingRequest = true;
    $("#loadingGif").show();
    $("#loadMoreButton").hide();

    var httprequest = new XMLHttpRequest();
    var link;
    if (subreddit != '') {
        link = baseLink + "/r/" + encodeURIComponent(subreddit) + "/.json?limit=30&after=" + lastFullname;
    } else {
        link = baseLink + "/.json?limit=20&after=" + lastFullname;
    }
    httprequest.open("GET", link, true);
    httprequest.send();
    httprequest.onreadystatechange = stateChangeHandlers;

    // calculates the shortest column
    var min = document.getElementById("imageList0").offsetHeight;
    for (var j = 1; j < 4; j++) {
        var curMin = document.getElementById("imageList" + j).offsetHeight;
        if (curMin < min) {
            minCol = j;
            min = curMin;
        }
    }
}

function stateChangeHandlers() {
    if (this.readyState == 4) {
        if (this.status == 200) {
            parseJSON(this.responseText);
        } else {
            alert("Connection Error\nStatus code: " + this.status + "\n" + this.responseText);
        }
        pendingRequest = false;
        $("#loadingGif").hide();
        $("#loadMoreButton").show();
    }
}

function parseJSON(responseText) {
    var width = 350;
    var responseJSON = JSON.parse(responseText);
    var submissions = responseJSON.data.children;
    var currentColumn = minCol >= 0 ? minCol : 0;

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

            // fill the first two images to the shortest column to let it catch up
            if (minCol >= 0) {
                minCol = -1;
            } else {
                currentColumn = (currentColumn + 1) % 4;
            }
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


$(window).scroll(function() {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 2) {
        if (pendingRequest == false) {
            sendRequest(subreddit);
        }
    }
});

function gotoSubreddit(value,keyCode){
    if(keyCode==13){
        document.location = '/r/'+value;
    }
}
function sendSubredditSearchRequest(value) {
    if (value != '') {
        if (subredditSearchRequest != null) {
            subredditSearchRequest.abort();
        } else {
            subredditSearchRequest = new XMLHttpRequest();
        }
        var link = baseLink + "/api/subreddits_by_topic.json?query=" + encodeURIComponent(value);
        subredditSearchRequest.open("GET", link, true);
        subredditSearchRequest.send();
        subredditSearchRequest.onreadystatechange = subredditSearchStateChangeHandler;
    }
}

function subredditSearchStateChangeHandler() {
    if (this.readyState == 4) {
        if (this.status == 200) {
            parseJSON(this.responseText);

            $("#subredditSearcher").autocomplete({
                source : availableTags
            });
        }
    }
}
