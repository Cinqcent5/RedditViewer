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
            document.write(this.responseText);
        } else {
            document.write("Connection Error");
        }
    }
}
