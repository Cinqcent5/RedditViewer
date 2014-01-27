function CurrentState(subreddit, order, topTime, query, searchTime, searchOrder) {
    this.baseLink = "http://www.reddit.com";

    this.subreddit = subreddit;
    this.order = order;
    this.topTime = topTime;
    this.query = query;
    this.searchTime = searchTime;
    this.searchOrder = searchOrder;

    this.lastFullname = "";
    this.pendingRequest = false;
    this.subredditSearchRequest = null;
    this.minCol = -1;
    this.maxCol = -1;
    this.alreadyShown = {};
    this.sendCount = 0;
    this.numCols = Math.floor((window.innerWidth - 15) / 375);
    if (this.numCols < 1) {
        this.numCols = 1;
    }

    var limit = 15;
    // setup the starting url
    //if query is empty, do a normal listing retrieval, otherwise do a search
    if (query == "") {
        var topTime = "";
        if (this.order == "top") {
            if (this.topTime == "") {
                topTime = "&t=day";
            } else {
                topTime = "&t=" + this.topTime;
            }
        }
        var postfix = "/" + this.order + ".json?limit=" + limit + this.lastFullname + topTime + "&after=";
        if (this.subreddit != '') {
            this.link = this.baseLink + "/r/" + encodeURIComponent(this.subreddit) + postfix;
        } else {
            this.link = this.baseLink + postfix;
        }
    } else {
        var postfix = "/search.json?limit=" + limit + "&restrict_sr=on&q=" + this.query + "&t=" + this.searchTime + "&sort=" + this.searchOrder + "&after=";
        if (this.subreddit != '') {
            this.link = this.baseLink + "/r/" + encodeURIComponent(this.subreddit) + postfix;
        } else {
            this.link = this.baseLink + postfix;
        }
    }

}

function sendRequest() {
    if (currentState.pendingRequest) {
        return;
    }
    currentState.pendingRequest = true;
    currentState.sendCount++;
    $("#loadingGif").show();
    $("#loadMoreButton").hide();

    var httprequest = new XMLHttpRequest();

    httprequest.open("GET", currentState.link + currentState.lastFullname, true);
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
        $("#loadingGif").hide();
        if (this.status == 200) {
            parseJSON(this.responseText);
        } else {
            alert("Connection Error\nStatus code: " + this.status + "\n" + this.responseText);
            currentState.pendingRequest = false;
        }

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

                //image
                var imageNode = document.createElement("img");
                imageNode.setAttribute("class", "image");
                imageNode.setAttribute("src", thumbUrl);
                imageNode.setAttribute("width", width);

                var imageLinkNode = document.createElement("a");
                imageLinkNode.setAttribute("class", "imageLink");
                imageLinkNode.setAttribute("href", url);
                imageLinkNode.setAttribute("target", "_blank");
                imageLinkNode.appendChild(imageNode);

                //Overlays
                var voteNode  =document.createElement("span");
                voteNode.setAttribute("class","voteCount");
                voteNode.innerHTML=data.score+" pts";
                
                var commentNode  =document.createElement("span");
                commentNode.setAttribute("class","commentCount");
                commentNode.innerHTML=data.num_comments+" comments";
                
                var countContainer=document.createElement("div");
                countContainer.setAttribute("class","countContainer");
                countContainer.appendChild(voteNode);
                countContainer.appendChild(commentNode);
                
                var permalinkNode = document.createElement("a");
                permalinkNode.setAttribute("class", "permalink");
                permalinkNode.setAttribute("href", currentState.baseLink + permalink);
                permalinkNode.setAttribute("target", "_blank");
                permalinkNode.innerHTML = title;

                var authorNode = document.createElement("a");
                authorNode.setAttribute("class", "author");
                authorNode.setAttribute("href", "http://reddit.com/u/" + data.author);
                authorNode.setAttribute("target", "_blank");
                authorNode.innerHTML = "u/" + data.author;

                var subredditNode = document.createElement("a");
                subredditNode.setAttribute("class", "imageSubreddit");
                subredditNode.setAttribute("href", "/r/" + data.subreddit);
                subredditNode.setAttribute("target", "_blank");
                subredditNode.innerHTML = "r/" + data.subreddit;

                var overlayNode = document.createElement("div");
                overlayNode.setAttribute("class", "imageOverlay");
                overlayNode.appendChild(countContainer);
                overlayNode.appendChild(permalinkNode);
                overlayNode.appendChild(authorNode);
                overlayNode.appendChild(subredditNode);

                //Container
                var imageContainerNode = document.createElement("ul");
                imageContainerNode.setAttribute("class", "imageContainer");
                imageContainerNode.setAttribute("id", fullname);
                imageContainerNode.setAttribute("onmouseover", 'displayOverlay(this,true)');
                imageContainerNode.setAttribute('onmouseout', 'displayOverlay(this,false)');
                imageContainerNode.appendChild(imageNode);
                imageContainerNode.appendChild(overlayNode);

                document.getElementById("imageList" + currentColumn).appendChild(imageContainerNode);

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
        currentState.pendingRequest = false;
        if (currentState.sendCount <= 10 && document.body.offsetHeight < window.innerHeight) {
            sendRequest();
        }
    } else {
        $("#endNotification").show();
        currentState.pendingRequest = true;
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

function setTopTime(obj) {
    var t = obj.options[obj.selectedIndex].value;
    document.location = "top?t=" + t;
}

function sendSearchRequest() {
    var searchBox = document.getElementById("searchBox");
    if (searchBox.value == "") {
        return;
    }
    var searchTimeSelector = document.getElementById("searchTimeSelector");
    var searchSortSelector = document.getElementById("searchSortSelector");
    var t = searchTimeSelector.options[searchTimeSelector.selectedIndex].value;
    var sort = searchSortSelector.options[searchSortSelector.selectedIndex].value;
    var subreddit = currentState.subreddit == "" ? "" : "r/" + currentState.subreddit + "/";
    document.location = "/" + subreddit + "search?q=" + searchBox.value + "&t=" + t + "&sort=" + sort;
}

function scrollHandler() {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 1500) {
        sendRequest(currentState.subreddit);
    }
};

function checkSearchBox(keyCode) {
    if (keyCode == 13) {
        sendSearchRequest();
    }
}

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
    if (currentState.query == "") {
        if (currentState.order == "") {
            document.getElementById("sorthot").className = "sortURLCurrent";
        } else {
            document.getElementById("sort" + currentState.order).className = "sortURLCurrent";
        }
    }

    $(window).scroll(scrollHandler);

    sendRequest();

}
