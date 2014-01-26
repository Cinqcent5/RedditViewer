from django.shortcuts import render
import json
import urllib2

def subredditSort(request, subreddit, order):
    return mainView(request, subreddit, order);
    
def sort(request, order):
    return mainView(request, "", order)

def subredditSearch(request, subreddit):
    return mainView(request, subreddit, "")

def subreddit(request, subreddit):
    return mainView(request, subreddit, "")


def default(request):
    return mainView(request, "", "")



def mainView(request, subreddit, order): 
    context = {}
    context['columns'] = [i for i in range(4)]
    context['subreddits'] = ['adviceanimals', 'aww', 'earthporn', 'funny', 'gaming', 'gifs', 'pics', 'reactiongifs', 'wallpapers', 'wtf']
    context['subreddit'] = subreddit
    context['orders'] = ['hot', 'new', 'rising', 'controversial', 'top']
    context['order'] = order
    context['timeFrames'] = [['day', 'today'], ['hour', 'this hour'], ['week', 'this week'], ['month', 'this month'], ['year', 'this year'], ['all', 'all time']]
    if "t" in request.GET:
        context['topTime'] = request.GET["t"];
        context['searchTime'] = request.GET["t"];
    else:
        context['topTime'] = "day";
        context['searchTime'] = "all";
    
    context['searchOrders'] = ['relevance', 'hot', 'new', 'top'];
    
    if "sort" in request.GET:
        context['searchOrder'] = request.GET["sort"];
    else:
        context['searchOrder'] = "relevance";
        
    if "q" in request.GET:
        context['query'] = request.GET["q"];
    else:
        context['query'] = "";
        
    if(subreddit == ""):
        context['image'] = "http://b.thumbs.redditmedia.com/harEHsUUZVajabtC.png"
        context['link'] = "http://www.reddit.com";
        context['name'] = "";
    else:
        try:
            h1 = urllib2.urlopen("http://www.reddit.com/r/" + subreddit + "/about.json", timeout=5)
            jsonObj=json.loads(h1.read());
            context['image'] = jsonObj["data"]["header_img"]
            context['link'] = "http://www.reddit.com/r/" + subreddit;
            context['name'] = jsonObj["data"]["display_name"];
        except Exception:
            context['image'] = "http://b.thumbs.redditmedia.com/harEHsUUZVajabtC.png"
            context['link'] = "http://www.reddit.com";
            context['name'] = "";
        
    return render(request, 'picviewer/index.html', context)

