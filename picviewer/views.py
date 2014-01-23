from django.shortcuts import render


def index(request):
    context = {};
    context['columns'] = [i for i in range(4)]
    return render(request,'picviewer/index.html',context)