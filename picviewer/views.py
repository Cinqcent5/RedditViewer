from django.shortcuts import render


def default(request):
    return loadSubreddit(request, '')

def loadSubreddit(request,subreddit):
    context = {}
    context['columns'] = [i for i in range(4)]
    context['subreddits'] = ['adviceanimals', 'aww', 'earthporn', 'funny', 'gaming', 'gifs', 'pics', 'reactiongifs', 'wallpapers', 'wtf']
    context['subreddit'] = subreddit;
    return render(request, 'picviewer/index.html', context)

