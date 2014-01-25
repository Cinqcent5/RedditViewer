from django.shortcuts import render


def default(request):
    return full(request, "", "")

def subreddit(request, subreddit):
    return full(request, subreddit, "")
    
def sort(request, order):
    return full(request, "", order)

def full(request, subreddit, order): 
        
    context = {}
    context['columns'] = [i for i in range(4)]
    context['subreddits'] = ['adviceanimals', 'aww', 'earthporn', 'funny', 'gaming', 'gifs', 'pics', 'reactiongifs', 'wallpapers', 'wtf']
    context['subreddit'] = subreddit
    context['orders'] = ['hot', 'new', 'rising', 'controversial', 'top']
    context['order'] = order
    return render(request, 'picviewer/index.html', context)

