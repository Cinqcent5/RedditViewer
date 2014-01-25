function CurrentState(subreddit, order) {
    this.baseLink = "http://www.reddit.com";
    this.subreddit = subreddit;
    this.order = order;
    this.lastFullname = "";
    this.backupLastFullname = "";
    this.pendingRequest = false;
    this.subredditSearchRequest = null;
    this.minCol = -1;
    this.maxCol = -1;
    this.alreadyShown = {};
    this.numCols = Math.floor((window.innerWidth - 15) / 375);
    if (this.numCols < 1) {
        this.numCols = 1;
    }

}

function sendRequest() {
    if (currentState.pendingRequest) {
        return;
    }
    currentState.pendingRequest = true;
    var limit = 15;
    $("#loadingGif").show();
    $("#loadMoreButton").hide();

    var httprequest = new XMLHttpRequest();
    var link;
    var postfix = "/" + currentState.order + ".json?limit=" + limit + "&after=" + currentState.lastFullname;
    if (currentState.subreddit != '') {
        link = currentState.baseLink + "/r/" + encodeURIComponent(currentState.subreddit) + postfix;
    } else {
        link = currentState.baseLink + postfix;
    }
    httprequest.open("GET", link, true);
    httprequest.send();
    httprequest.onreadystatechange = stateChangeHandlers;

    // calculates the shortest and highest column
    var min = document.getElementById("imageList0").offsetHeight;
    var max = document.getElementById("imageList0").offsetHeight;
    for (var j = 1; j < currentState.numCols; j++) {
        var curHeight = document.getElementById("imageList" + j).offsetHeight;
        if (curHeight < min) {
            currentState.minCol = j;
            min = curHeight;
        }
        if (curHeight > max) {
            currentState.maxCol = j;
            max = curHeight;
        }
    }

    // if for some reason max and min columns are the same, reset them
    if (currentState.minCol == currentState.maxCol) {
        currentState.minCol = 0;
        currentState.maxCol = -1;
    }
};

function stateChangeHandlers() {
    if (this.readyState == 4) {
        if (this.status == 200) {
            currentState.pendingRequest = parseJSON(this.responseText);
        } else {
            alert("Connection Error\nStatus code: " + this.status + "\n" + this.responseText);
            currentState.pendingRequest = false;
        }

        $("#loadingGif").hide();
        if (currentState.pendingRequest) {
            $("#loadMoreButton").hide();
        } else {
            $("#loadMoreButton").show();
        }

    }
};

function parseJSON(responseText) {
    var width = 350;
    var responseJSON = JSON.parse(responseText);
    var submissions = responseJSON.data.children;
    var currentColumn = currentState.minCol >= 0 ? currentState.minCol : 0;

    for (var i = 0; i < submissions.length; i++) {
        var data = submissions[i].data;
        var permalink = data.permalink;
        var title = data.title;
        var fullname = data.name;

        // Only display images that haven't been shown yet
        if (!( fullname in currentState.alreadyShown)) {
            var url = data.url;
            var thumbUrl = url;
            var isPicture = false;
            var match;
            if (( match = url.match(/(i\.imgur\.com\/[A-z0-9]{5,7})(\.(jpeg|jpg|png|bmp))$/)) != null) {
                // if it's an direct image url from imgur, we can limit the image
                // size to 640x640
                // by adding 'l' to the end of the file hash
                thumbUrl = "http://" + match[1] + "l" + match[2];
                isPicture = true;
            } else if (( match = url.match(/imgur\.com\/([A-z0-9]{5,7})$/)) != null) {
                // if it's an imgur url in the form of imgur.com/xxxxxxx , there
                // will be a picture at
                // i.imgur.com/xxxxxxxl.jpg that can be used for thumbnail
                thumbUrl = "http://i.imgur.com/" + match[1] + "l.jpg";
                isPicture = true;
            } else if (url.match(/\.(jpeg|jpg|gif|png|bmp)$/) != null) {
                isPicture = true;
            }

            // Only display the link if it's a image
            if (isPicture) {
                // If this is the max column, skip the first turn to let others catch up
                if (currentState.maxCol >= 0 && currentColumn == currentState.maxCol) {
                    currentState.maxCol = -1;
                    currentColumn = (currentColumn + 1) % currentState.numCols;
                }

                var imageHTML = "<a class='imageLink' href=" + url + " target=_blank><img class='image' src=" + thumbUrl + " width=" + width + "></a>";
                var overlayHTML = "<span class='imageOverlay'><a class='permalink' href=" + currentState.baseLink + permalink + " target=_blank>" + title + "</a></span>";
                var node = document.createElement("ul");
                node.setAttribute("class", "imageContainer");
                node.setAttribute("id", fullname);
                node.setAttribute("onmouseover", 'displayOverlay(this,true)');
                node.setAttribute('onmouseout', 'displayOverlay(this,false)');
                node.innerHTML = imageHTML + overlayHTML;
                document.getElementById("imageList" + currentColumn).appendChild(node);

                // fill the first two images to the shortest column to let it catch
                // up
                if (currentState.minCol >= 0 && currentColumn == currentState.minCol) {
                    currentState.minCol = -1;
                } else {
                    currentColumn = (currentColumn + 1) % currentState.numCols;
                }
            }
            currentState.alreadyShown[fullname] = true;
        }
    }

    // set the fullname of the last submission fetched
    if (responseJSON.data.after != null) {
        currentState.lastFullname = responseJSON.data.after;
        // Get more images if there are not enough images fill the initial screen
        if (document.body.offsetHeight < window.innerHeight) {
            sendRequest(currentState.subreddit);
        }
        return false;
    } else {
        $("#endNotification").show();
        return true;
    }

};

// Toggles the image overlay (title, comment link, etc) when the mouse
// hovers over and when it moves out
function displayOverlay(obj, show) {
    if (show) {
        obj.lastChild.style.display = 'block';
    } else {
        obj.lastChild.style.display = 'none';
    }
};

function scrollHandler() {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 1500) {
        sendRequest(currentState.subreddit);
    }
};

function gotoSubreddit(value, keyCode) {
    if (keyCode == 13) {
        document.location = '/r/' + value;
    }
}

function sendSubredditSearchRequest(value) {
    if (value != '') {
        if (subredditSearchRequest != null) {
            subredditSearchRequest.abort();
        } else {
            subredditSearchRequest = new XMLHttpRequest();
        }
        var link = currentState.baseLink + "/api/subreddits_by_topic.json?query=" + encodeURIComponent(value);
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

function setup() {

    //indicate the current sort order
    if (currentState.order == "") {
        document.getElementById("sorthot").className = "sortURLCurrent";
    } else {
        document.getElementById("sort" + currentState.order).className = "sortURLCurrent";
    }

    $(window).scroll(scrollHandler);
    sendRequest();

}
