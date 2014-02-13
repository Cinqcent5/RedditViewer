from django.shortcuts import render
from picviewer.models import User
import datetime
import json
import urllib2
import uuid

def subredditSort(request, subreddit, order):
    return mainView(request, subreddit, order, "");
    
def sort(request, order):
    return mainView(request, "", order, "")

def subredditSearch(request, subreddit):
    return mainView(request, subreddit, "", "")

def subreddit(request, subreddit):
    return mainView(request, subreddit, "", "")

def userSort(request, user, order):
    return mainView(request, "", order, user);

def user(request, user):
    return mainView(request, "", "", user);
        
def default(request):
    return mainView(request, "", "", "")



def mainView(request, subreddit, order, user): 
    context = {}
    context['columns'] = [i for i in range(4)]
    context['subreddits'] = ['adviceanimals', 'aww', 'earthporn', 'funny', 'gaming', 'gifs', 'pics', 'reactiongifs', 'wallpapers', 'wtf']
    context['subreddit'] = subreddit
    context['orders'] = ['hot', 'new', 'rising', 'controversial', 'top']
    context['order'] = order
    context['timeFrames'] = [['day', 'today'], ['hour', 'this hour'], ['week', 'this week'], ['month', 'this month'], ['year', 'this year'], ['all', 'all time']]
    if "t" in request.GET:
        context['timeFrame'] = request.GET["t"]
        context['searchTime'] = request.GET["t"]
    else:
        context['timeFrame'] = "day"
        context['searchTime'] = "all"
    
    context['searchOrders'] = ['relevance', 'hot', 'new', 'top']
    
    if "sort" in request.GET:
        context['searchOrder'] = request.GET["sort"]
    else:
        context['searchOrder'] = "relevance"
        
    if "q" in request.GET:
        context['query'] = request.GET["q"]
    else:
        context['query'] = ""
    
    # retrieve subreddit information    
    if(subreddit == ""):
        context['image'] = "http://b.thumbs.redditmedia.com/harEHsUUZVajabtC.png"
        context['link'] = "http://www.reddit.com";
        context['name'] = ""
        context['subredditDescription'] = ""
    else:
        try:
            h1 = urllib2.urlopen("http://www.reddit.com/r/" + subreddit + "/about.json", timeout=5)
            jsonObj = json.loads(h1.read())
            context['image'] = jsonObj["data"]["header_img"]
            context['link'] = "http://www.reddit.com/r/" + subreddit
            context['name'] = jsonObj["data"]["display_name"]
            context['subredditDescription'] = jsonObj["data"]["public_description"]
        except Exception:
            context['image'] = "http://b.thumbs.redditmedia.com/harEHsUUZVajabtC.png"
            context['link'] = "http://www.reddit.com"
            context['name'] = ""
            context['subredditDescription'] = ""
    
    context['userOrders'] = ['hot', 'new', 'controversial', 'top']
    context['user'] = user
    
    if request.COOKIES.has_key('riv'):
        # returning user, retrieve his/her settings
        try:
            user = User.objects.get(uid=request.COOKIES[ 'riv' ])
        except:
            user = User(uid=request.COOKIES[ 'riv' ], created_date=datetime.datetime.now())
        user.last_visited_date = datetime.datetime.now()
        if "save_settings" in request.POST:
            # user just clicked on save settings button, save the settings
            # to the database
            user.allow_nsfw = "allow_nsfw" in request.POST
            user.show_details = "show_details" in request.POST
            user.show_all_links = "show_all_links" in request.POST
        user.save()
        context["allowNSFW"] = user.allow_nsfw
        context["showDetails"] = user.show_details
        context["showAllLinks"] = user.show_all_links

    else:
        # use default settings
        context["allowNSFW"] = False
        context["showDetails"] = False
        context["showAllLinks"] = False
       
    response = render(request, 'picviewer/index.html', context)
    
    
    # set the cookies for first time users
    if not request.COOKIES.has_key('riv'):
        if "HTTP_USER_AGENT" in request.META:
            user_agent=request.META["HTTP_USER_AGENT"]
        else:
            user_agent=""
        
        # don't set cookies for search bots
        if "Googlebot" not in user_agent:
            uid = uuid.uuid4()
            response.set_cookie(key='riv', value=uid, max_age=31536000)
            user = User(uid=uid, created_date=datetime.datetime.now(), last_visited_date=datetime.datetime.now(),user_agent=user_agent)
            user.save()
        
    return  response

