from django.shortcuts import render

def subredditSort(request, subreddit, order):
    return mainView(request, subreddit, order);
    
def sort(request, order):
    return mainView(request, "", order)

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
    context['topTimes'] = [['day', 'today'], ['hour', 'this hour'], ['week', 'this week'], ['month', 'this month'], ['year', 'this year'], ['all', 'all time']]
    if "t" in request.GET:
        context['topTime'] = request.GET["t"];
    else:
        context['topTime'] = "day";
    
    return render(request, 'picviewer/index.html', context)

