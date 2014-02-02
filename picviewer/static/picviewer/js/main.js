function CurrentState(subreddit, order, timeFrame, query, searchTime, searchOrder, user, allowNSFW, showDetails, showAllLinks) {
    this.baseLink = "http://www.reddit.com";
    this.imgurAlbumBaseLink = "https://api.imgur.com/3/album/";
    this.imgurClient = "d452866b8d94ada";

    this.subreddit = subreddit;
    this.order = order;
    this.timeFrame = timeFrame;
    this.query = query;
    this.searchTime = searchTime;
    this.searchOrder = searchOrder;
    this.user = user;
    this.allowNSFW = allowNSFW == "True";
    this.showDetails = showDetails == "True";
    this.showAllLinks = showAllLinks == "True";

    this.lastFullname = "";
    this.pendingRequest = false;
    this.subredditSearchRequest = null;
    this.minCol = -1;
    this.maxCol = -1;
    this.alreadyShown = {};
    this.imgurAlbums = {};
    this.currentAlbumImage = {};
    this.sendCount = 0;
    this.numCols = Math.floor((window.innerWidth - 15) / 375);
    if (this.numCols < 1) {
        this.numCols = 1;
    }

    var limit = 15;
    // setup the starting url
    if (user != "") {
        // listing of user submissions
        var timeFrameQuery = "";
        if (this.order == "top" || this.order == "controversial") {
            if (this.timeFrame == "") {
                timeFrameQuery = "&t=day";
            } else {
                timeFrameQuery = "&t=" + this.timeFrame;
            }
        }
        var postfix = "/user/" + this.user + "/submitted/.json?limit=" + limit + "&sort=" + this.order + timeFrameQuery + "&after=";
        this.link = this.baseLink + postfix;
    } else if (query != "") {
        // search
        var postfix = "/search.json?limit=" + limit + "&restrict_sr=on&q=" + this.query + "&t=" + this.searchTime + "&sort=" + this.searchOrder + "&after=";
        if (this.subreddit != '') {
            this.link = this.baseLink + "/r/" + encodeURIComponent(this.subreddit) + postfix;
        } else {
            this.link = this.baseLink + postfix;
        }
    } else {
        // normal/subreddit listing retrieval
        var timeFrameQuery = "";
        if (this.order == "top" || this.order == "controversial") {
            if (this.timeFrame == "") {
                timeFrameQuery = "&t=day";
            } else {
                timeFrameQuery = "&t=" + this.timeFrame;
            }
        }
        var postfix = "/" + this.order + ".json?limit=" + limit + timeFrameQuery + "&after=";
        if (this.subreddit != '') {
            this.link = this.baseLink + "/r/" + encodeURIComponent(this.subreddit) + postfix;
        } else {
            this.link = this.baseLink + postfix;
        }
    }

}

// Initiate the request to retrieve the submission listing
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

// Handler for when the reddit server responds to the listing request
function stateChangeHandlers() {
    if (this.readyState == 4) {
        $("#loadingGif").hide();
        if (this.status == 200) {
            parseJSON(this.responseText);
        } else if (this.status == 0) {
            currentState.pendingRequest = false;
            document.getElementById("endNotification").innerHTML = "This subreddit likely does not exist";
            $("#endNotification").show();
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

// Parse the response and add the images/links to the html
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

        // check for NSFW content
        if (currentState.allowNSFW || data.over_18 == false) {
            // Only display link that haven't been shown yet
            if (!( fullname in currentState.alreadyShown)) {
                var url = data.url;
                var thumbUrl = url;
                var isPicture = false;
                var isImgurAlbum = false;
                var match;
                if (( match = url.match(/imgur\.com\/a\/([A-z0-9]{5,7})/)) != null) {
                    sendImgurRequest(match[1], fullname);
                    isImgurAlbum = true;
                } else if (( match = url.match(/(i\.imgur\.com\/[A-z0-9]{5,7})(\.(jpeg|jpg|png|bmp))$/)) != null) {
                    // if it's an direct image url from imgur, we can limit the image
                    // size to 640x640
                    // by adding 'l' to the end of the file hash
                    thumbUrl = "http://" + match[1] + "l" + match[2];
                    isPicture = true;
                } else if (( match = url.match(/imgur\.com\/([A-z0-9]{5,7})$/)) != null) {
                    // if it's an imgur url in the form of imgur.com/xxxxxxx , there
                    // will be a picture at
                    // i.imgur.com/xxxxxxxl.jpg that can be used for thumbnail
                    thumbUrl = "http://i.imgur.com/" + match[1] + ".jpg";
                    isPicture = true;
                } else if (url.match(/\.(jpeg|jpg|gif|png|bmp)$/) != null) {
                    isPicture = true;
                }

                // Only display the link if it's a image or user selected showing all links
                if (isPicture || isImgurAlbum || currentState.showAllLinks) {
                    // If this is the max column, skip the first turn to let others catch up
                    if (currentState.maxCol >= 0 && currentColumn == currentState.maxCol) {
                        currentState.maxCol = -1;
                        currentColumn = (currentColumn + 1) % currentState.numCols;
                    }
                    if (isPicture || isImgurAlbum) {

                        //image
                        var imageNode = document.createElement("img");
                        if (currentState.showDetails) {
                            imageNode.setAttribute("class", "imageWithDetails");
                        } else {
                            imageNode.setAttribute("class", "image");
                        }
                        imageNode.setAttribute("id", "img_" + fullname);
                        imageNode.setAttribute("src", thumbUrl);
                        imageNode.setAttribute("width", width);
                        imageNode.setAttribute("alt", title);
                        imageNode.onload = checkImageHeight;

                        var imageLinkNode = document.createElement("a");
                        imageLinkNode.setAttribute("class", "imageLink");
                        imageLinkNode.setAttribute("href", url);
                        imageLinkNode.setAttribute("target", "_blank");
                        imageLinkNode.appendChild(imageNode);

                        var detailsClass;
                        if (currentState.showDetails) {
                            detailsClass = "details";
                        } else {
                            detailsClass = "detailsOverlay";
                        }

                        detailsNode = createDetailsNode(data, detailsClass);

                        var hoverContainerNode = document.createElement("div");
                        hoverContainerNode.setAttribute("class", "hoverContainer");
                        hoverContainerNode.appendChild(detailsNode);
                        hoverContainerNode.appendChild(imageLinkNode);

                        //Container
                        var imageContainerNode = document.createElement("ul");
                        imageContainerNode.setAttribute("class", "imageContainer");
                        imageContainerNode.setAttribute("id", fullname);
                        if (!currentState.showDetails) {
                            hoverContainerNode.addEventListener("mouseover", displayOverlay);
                            hoverContainerNode.addEventListener('mouseout', hideOverlay);
                        }

                        imageContainerNode.appendChild(hoverContainerNode);

                        if (isImgurAlbum) {
                            var prevImageNode = document.createElement("a");
                            prevImageNode.setAttribute("class", "prevImage");
                            prevImageNode.setAttribute("id", "prev_" + fullname);
                            prevImageNode.onclick = getPrevImage;

                            var albumInfoNode = document.createElement("p");
                            albumInfoNode.setAttribute("class", "albumInfo");

                            var nextImageNode = document.createElement("a");
                            nextImageNode.setAttribute("class", "nextImage");
                            nextImageNode.setAttribute("id", "next_" + fullname);
                            nextImageNode.onclick = getNextImage;

                            var albumImageInfoNode = document.createElement("p");
                            albumImageInfoNode.setAttribute("class", "albumImageInfo");

                            var albumNavigatorNode = document.createElement("div");
                            albumNavigatorNode.setAttribute("class", "albumNavigator");
                            albumNavigatorNode.setAttribute("id", "nav_" + fullname);

                            albumNavigatorNode.appendChild(prevImageNode);
                            albumNavigatorNode.appendChild(albumInfoNode);
                            albumNavigatorNode.appendChild(nextImageNode);
                            albumNavigatorNode.appendChild(albumImageInfoNode);
                            
                            imageNode.removeAttribute("src");

                            imageNode.style.borderRadius = "0 0 3px 3px";
                            detailsNode.style.borderRadius = "0 0 3px 3px";
                            imageContainerNode.appendChild(albumNavigatorNode);

                        }

                        imageContainerNode.appendChild(hoverContainerNode);
                        document.getElementById("imageList" + currentColumn).appendChild(imageContainerNode);

                    } else if (currentState.showAllLinks) {
                        detailsNode = createDetailsNode(data, "detailsOnly");
                        document.getElementById("imageList" + currentColumn).appendChild(detailsNode);

                    }
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

function createDetailsNode(data, detailsClass) {
    //submission details
    var voteNode = document.createElement("p");
    voteNode.setAttribute("class", "voteCount");
    voteNode.innerHTML = data.score + " pts";

    var commentNode = document.createElement("a");
    commentNode.setAttribute("class", "commentCount");
    commentNode.innerHTML = data.num_comments + " comments";
    commentNode.setAttribute("href", currentState.baseLink + data.permalink);
    commentNode.setAttribute("target", "_blank");

    var countContainer = document.createElement("article");
    countContainer.setAttribute("class", "countContainer");
    countContainer.appendChild(voteNode);
    countContainer.appendChild(commentNode);

    var permalinkNode = document.createElement("a");
    permalinkNode.setAttribute("class", "permalink");
    permalinkNode.setAttribute("href", data.url);
    permalinkNode.setAttribute("target", "_blank");
    permalinkNode.innerHTML = data.title;

    var authorNode = document.createElement("a");
    authorNode.setAttribute("class", "author");
    authorNode.setAttribute("href", "/u/" + data.author);
    authorNode.setAttribute("target", "_blank");
    authorNode.innerHTML = "u/" + data.author;

    var subredditNode = document.createElement("a");
    subredditNode.setAttribute("class", "imageSubreddit");
    subredditNode.setAttribute("href", "/r/" + data.subreddit);
    subredditNode.setAttribute("target", "_blank");
    subredditNode.innerHTML = "r/" + data.subreddit;

    var additionalLinks = document.createElement("article");
    additionalLinks.setAttribute("class", "additionalLinks");
    additionalLinks.appendChild(authorNode);
    additionalLinks.appendChild(subredditNode);

    var detailsNode = document.createElement("div");

    detailsNode.setAttribute("class", "details");

    detailsNode.setAttribute("class", detailsClass);

    detailsNode.appendChild(countContainer);
    detailsNode.appendChild(permalinkNode);
    detailsNode.appendChild(additionalLinks);

    return detailsNode;

}

// Toggles the image overlay (title, comment link, etc) when the mouse
// hovers over and when it moves out
function displayOverlay() {
    this.firstChild.style.display = 'block';

};

function hideOverlay() {
    this.firstChild.style.display = 'none';
}

// Direct the user to the correct url when they click on the sort by time
function setTimeFrame(obj) {
    var t = obj.options[obj.selectedIndex].value;
    document.location = currentState.order + "?t=" + t;
}

// Directs the user to the correct search url
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

// Load more images when the user scroll to near the bottom
function scrollHandler() {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 1200) {
        sendRequest(currentState.subreddit);
    }
};

// Send the search request when the user presses "Enter" key
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

// For very tall imgur images, use the original resolution image as the thumbnail
function checkImageHeight() {
    if (this.offsetHeight > 1000) {
        url = this.getAttribute("src");
        if (url.match(/i\.imgur\.com\/[A-z0-9]{5,7}l\.(jpeg|jpg|png|bmp)$/)) {
            this.setAttribute("src", url.replace(/l\./, "."));
        }
    }
}

// Toggle the settings dropdown
function toggleSettingsDropdown() {
    $("#settingsDropdown").toggle();
}

// Prepare the request to retrieve the urls of images in an imgur album
function sendImgurRequest(albumId, fullname) {
    var httprequest = new XMLHttpRequest();

    httprequest.open("GET", currentState.imgurAlbumBaseLink + albumId, true);
    httprequest.setRequestHeader("Authorization", "Client-ID " + currentState.imgurClient);
    httprequest.send();
    httprequest.fullname = fullname;
    httprequest.onreadystatechange = imgurAlbumHandler;
}

// Upon imgur album response, map the list of album image urls to the reddit link id/fullname
function imgurAlbumHandler() {
    if (this.readyState == 4) {
        if (this.status == 200) {
            var responseJSON = JSON.parse(this.responseText);
            var images = responseJSON.data.images;
            //map the list of album image urls to the reddit link id/fullname
            currentState.imgurAlbums[this.fullname] = images;
            currentState.currentAlbumImage[this.fullname] = 1;

            if (images == null || images.length == 0) {
                //Hide the element if the album is empty
                document.getElementById(this.fullname).style.display = "none";
            } else {
                //Set the thumbnail to the first picture of the album
                setAlbumImage(images, 0, this.fullname);
            }
        }
    }
}

// Helper function to change the image src of album thumbnail and the descriptions
function setAlbumImage(images, index, fullname) {
    image = images[index];
    var link = image.link;
    var match;

    // limit the image size to 640x640 by adding 'l' to the end of the file hash
    if (( match = link.match(/(i\.imgur\.com\/[A-z0-9]{5,7})(\.(jpeg|jpg|png|bmp))$/)) != null) {
        link = "http://" + match[1] + "l" + match[2];
    }
    var imgNode=document.getElementById("img_" + fullname);
    imgNode.setAttribute("src", link);

    imgNode.parentNode.setAttribute("href",image.link);
    
    //update the descriptions
    var navNode = document.getElementById("nav_" + fullname);
    navNode.childNodes[1].innerHTML = (index + 1) + " of " + images.length;
    if (image.title != null) {
        navNode.childNodes[3].innerHTML = image.title;
    } else if (image.description != null) {
        navNode.childNodes[3].innerHTML = image.description;
    }

    //update the current image index
    currentState.currentAlbumImage[fullname] = index;
}

function getPrevImage() {
    var fullname = this.getAttribute("id").substring(5);

    images = currentState.imgurAlbums[fullname];
    cur = currentState.currentAlbumImage[fullname];
    prev = cur == 0 ? images.length - 1 : cur - 1;

    setAlbumImage(images, prev, fullname);

}

function getNextImage() {
    var fullname = this.getAttribute("id").substring(5);

    images = currentState.imgurAlbums[fullname];
    cur = currentState.currentAlbumImage[fullname];
    next = (cur + 1) % images.length;

    setAlbumImage(images, next, fullname);
}

// Initial setup
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
